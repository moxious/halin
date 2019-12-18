import React, { Component } from 'react';
import uuid from 'uuid';
import moment from 'moment';
import hoc from '../../../higherOrderComponents';
import _ from 'lodash';
import Spinner from '../../../ui/scaffold/Spinner/Spinner';
import api from '../../../../api';
import kb from '../../../../api/knowledgebase';
import { Message, Form, Icon } from 'semantic-ui-react';
import unflatten from '../unflatten';
import MetricsChart from '../MetricsChart/MetricsChart';
import MetricDescription from '../MetricDescription/MetricDescription';

const { sentry, queryLibrary } = api;

const RECORDS = 100;
const MAX_AGE = 2 * 1000;

const code = text => <span style={{fontFamily:'monospace'}}>{text}</span>;

class MetricsPane extends Component {
    state = {
        key: uuid.v4(),
        metrics: null,
        loading: false,
        activeMetric: null,
        menu: {},
        observations: RECORDS,
        dateFormat: 'MMMM Do YYYY, h:mm:ss a',
    };

    componentDidMount() {
        return this.props.node.getAvailableMetrics()
            .then(metrics => {
                // Convert to the format that the dropdown menu wants.
                const metricOptions = _.sortBy(_.uniqBy(metrics.map(m => ({
                    key: m.name, 
                    text: m.name + ' -- ' + (kb.metricsReference[m.name] || '(No description available)'), 
                    value: m.name,
                })), 'key'), 'key');

                const flatMap = {};
                metricOptions.forEach(mo => flatMap[mo.key] = mo.key);

                const menu = unflatten(flatMap);

                let defaultMetric = 'neo4j.bolt.connections_opened';
                
                if (metrics.filter(m => m.name === defaultMetric).length === 0) {
                    defaultMetric = _.get(metrics[0], 'name');
                }
               
                // Sorted and unique options
                this.setState({ 
                    metrics: metricOptions, 
                    menu,
                    activeMetric: defaultMetric,
                });

                if (defaultMetric) {
                    return this.getMetric(defaultMetric);
                }
                return null;
            });
    }

    selectMetric = (event, data) => {
        const promise = this.getMetric(data.value);
        this.setState({
            activeMetric: data.value,
        });
        return promise;
    }

    haveCurrentMetricData(metric) {
        const data = this.state[metric];
        if (!data) { return false; }
        const lastObsTime = data[data.length - 1].t.getTime();
        const utcTimeNow = moment.utc().valueOf();

        if (utcTimeNow - lastObsTime < MAX_AGE) {
            return true;
        }

        sentry.fine(`Metric data for ${metric} aged out; ${moment.utc(lastObsTime).format()} vs. ${moment.utc(utcTimeNow).format()}`);
        return false;
    }

    convertMetricTimestampToLocalDate(val) {
        // Weird gotcha that is not documented:
        // Timings in the metrics file are given in **seconds since the epoch** not ms.
        // ¯\_(ツ)_/¯ - Also remember these are UTC timestamps, not local TZ.
        const msSinceEpoch = val * 1000;
        const utc = moment.utc(msSinceEpoch);
        return utc.local().toDate();
    }

    getMetric(metric) {
        if (this.haveCurrentMetricData(metric)) {
            return Promise.resolve(this.state[metric]);
        }

        this.setState({ loading: true });

        const params = {
            metric,
            last: api.driver.int(this.state.observations),
        };

        return this.props.node.run(queryLibrary.GET_METRIC.query, params)
            .then(data => data.records.map(r => ({
                t: this.convertMetricTimestampToLocalDate(r.get('timestamp').toNumber()),
                metric: r.get('metric'),
                map: r.get('map'),
            })).sort((a, b) => a.t - b.t)) // Keep sorted by date
            .then(data => {
                this.setState({ [metric]: data, loading: false, error: null });
                return data;
            })
            .catch(err => {
                sentry.reportError(`Failed to fetch metric ${metric}`, err);
                this.setState({
                    [metric]: [],
                    loading: false,
                    error: err,
                });
                return [];
            });
    }

    metricChooser() {
        return (
            <Form>
                <Form.Dropdown placeholder='Neo4j Metric Name'
                    search selection
                    label="Select Metric"
                    loading={_.isNil(this.state.metrics)}
                    allowAdditions={false}
                    upward={false}
                    onChange={this.selectMetric}
                    options={this.state.metrics} />
            </Form>
        );
    }

    render() {
        return (
            <div className='MetricsPane'>
                <MetricDescription metric={this.state.activeMetric} />
                { this.metricChooser() } 
                { this.content() }
            </div>
        )
    }

    getChartStart() {
        // Data is kept sorted.
        const arr = this.state[this.state.activeMetric] || [];
        const v = _.get(arr[0], 't');
        return v ? v.getTime() : new Date();
    }

    getChartEnd() {
        // Data is kept sorted.
        const arr = this.state[this.state.activeMetric] || [];
        const v = _.get(arr[arr.length-1], 't');
        return v ? v.getTime() : new Date();
    }

    describeDateRange() {
        const dt2Text = i => moment.utc(i).format(this.state.dateFormat);

        return (
            <h4><Icon name='calendar outline'/>
                {dt2Text(this.getChartStart())}
                <Icon name='arrow right'/>
                {dt2Text(this.getChartEnd())} (UTC)
            </h4>
        );
    }

    isLoading() {
        return (this.state.loading || 
            (this.state.activeMetric && _.isNil(this.state[this.state.activeMetric])));
    }

    renderMetricsChart() {
        if (this.state.error) {
            let err = `${this.state.error}`;
            const header = 'Error Fetching Metrics';
            let negative = true;

            if (err.indexOf('apoc.import.file.enabled') > -1) {
                err = 'In your neo4j.conf, you must set apoc.import.file.enabled=true in order to use this feature';
                negative = false;
            } else if(err.indexOf('java.io.FileNotFoundException') > -1) {
                // In versions of APOC prior to the required versions:
                // (3.5.0.4 for Neo4j 3.5, or 3.4.0.7 for Neo4j 3.4)
                // This error will come up because of a bug in an earlier patch version of APOC
                // that concatenates file paths incorrectly.
                // The solution is almost always to upgrade APOC.  If that does not work, the user may
                // have done some funky file path configuration of their Neo4j instance, which would be
                // pretty rare, but possible.
                err = `
                    Neo4j was not able to locate the metrics files on disk; you may be using an outdated APOC.
                    Please check that your version of APOC meets the requirements mentioned below, and
                    try again.`;
                negative = false;
            }

            return (
                <div>
                    <Message negative={negative} info={!negative}>
                        <Message.Header>{header}</Message.Header>
                        <p>{err}</p>
                    </Message>
                    { supportRequirements() }
                </div>
            );
        }

        return (
            <div>
                { this.describeDateRange() }

                <MetricsChart metric={this.state.activeMetric} data={this.state[this.state.activeMetric]} />
            </div>
        );
    }

    content() {
        if (!this.state.activeMetric) {
            return <Message>Please select a metric from the drop-down above</Message>
        }

        return (
            <div className='content' style={{ paddingTop: '15px', paddingBottom: '15px' }}>
                { this.isLoading() ? <Spinner active='true' /> : 
                    this.renderMetricsChart() }
            </div>
        );
    }
}

const compatCheckFn = ctx =>
    Promise.resolve(
        ctx.supportsAPOC() && 
        ctx.supportsMetrics() && 
        ctx.supportsLogStreaming());

// What to tell the user if the compatibility checks aren't satisfied.
const supportRequirements = () => {
    return (
        <Message warning>
            <Message.Header>Additional Configuration May Be Needed</Message.Header>
            <Message.Content>
                <p>In order to view metrics in Halin, some additional configuration of your Neo4j
                   instance may be necessary.
                </p>

                <ul style={{textAlign: 'left'}}>
                    <li>Ensure that your Neo4j instance <a target="halindocs" href='https://neo4j.com/docs/operations-manual/current/monitoring/metrics/expose/#metrics-csv'>exposes CSV metrics</a>. 
                    This is on by default in many versions of Neo4j.</li>
                    <li>Ensure that you have <a target="halindocs" href='https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases'>APOC installed</a>&nbsp;
                    <strong>with a version that is at least</strong> 3.5.0.4 for Neo4j 3.5, or 3.4.0.7 for Neo4j 3.4</li>
                    <li>Ensure that your {code('neo4j.conf')} includes {code('apoc.import.file.enabled=true')}, which
                    will permit access to the metrics.
                    </li>
                </ul>

            </Message.Content>
        </Message>            
    );
}

export default hoc.compatibilityCheckableComponent(
    MetricsPane,
    compatCheckFn,
    supportRequirements);
