import React, { Component } from 'react';
import Explainer from '../Explainer';
import DBStats from '../dbstats/DBStats';
import sentry from '../sentry';
import queryLibrary from '../data/queries/query-library';
import HalinQuery from '../data/queries/HalinQuery';
import Spinner from '../Spinner';
import QueryExecutionPlan from './QueryExecutionPlan';
import QueryStatTable from './queries/QueryStatTable';
import CSVDownload from '../data/download/CSVDownload';
import moment from 'moment';

import {
    Button,
    Progress,
    Form,
    Modal,
    Header,
    Checkbox,
    Icon,
} from 'semantic-ui-react';

// These are the states the collector can be in.
// State machine:  STOPPED -> RUNNING -> GATHERING -> STOPPED
// And any state can transition to error.
const STOPPED = 'Collector stopped';
const RUNNING = 'Collecting queries...';
const GATHERING = 'Gathering statistics...';
const ERROR = 'Error';

export default class SampleQueries extends Component {
    state = {
        includeHalinQueries: true,
        data: null,
        interval: 10000,
        percent: 0,
        updateInterval: null,
        status: STOPPED,
        displayColumns: [
            {
                Header: 'Plan',
                width: 80,
                Cell: ({ row }) =>
                    <Modal size='fullscreen' closeIcon trigger={
                        <Button icon='cogs' />
                    }>
                        <Header>Query Execution Plan</Header>
                        <Modal.Content scrolling>
                            <QueryExecutionPlan data={row} />
                        </Modal.Content>
                    </Modal>
            },
        ].concat(queryLibrary.DB_QUERY_STATS.columns),
    };

    help() {
        return (
            <div className='SampleQueriesHelp'>
                <p>Neo4j includes built-in procedures that let us monitor query execution plan and
                execution times for queries that run on the system.</p>

                <p>Halin allows temporary sampling of this data for inspecting what is running on
                    the system at any given time.</p>

                <p>All times are given in microseconds (one millionth of a second)</p>

                <p>For more information, read about the <strong>db.stats.*</strong>&nbsp;
                <a href="https://neo4j.com/docs/operations-manual/current/reference/procedures/">procedures here</a></p>
            </div>
        );
    }

    stopAsync() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
        }

        if (this.state.timer) {
            clearTimeout(this.state.timer);
        }

        if (this.mounted) {
            this.setState({ updateInterval: null, timer: null });
        }
    }

    stop(doCollection = true) {
        if (!this.collector) { return false; }
        return this.collector.stop()
            .then(() => {
                sentry.fine('Stopped collecting');
                if (this.mounted) { this.setState({ status: GATHERING }); }

                if (doCollection) {
                    return this.collector.stats();
                }
                return null;
            })
            .then(data => {
                this.stopAsync();
                if (this.mounted) {
                    this.setState({
                        data,
                        percent: 1,
                        timer: null,
                        error: null,
                        updateInterval: null,
                        status: STOPPED,
                    });
                }
            })
            .catch(err => {
                sentry.reportError(err, 'When stopping collection');
                this.stopAsync();
                if (this.mounted) {
                    this.setState({ data: null, status: ERROR, error: err });
                }
            });
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
        sentry.fine('SampleQuery is unmounting');
        this.stopAsync();
        this.stop(false);
    }

    start() {
        if (!this.collector) {
            this.collector = new DBStats(this.props.node);
        }

        this.setState({
            timer: null,
            progress: 0,
            updateInterval: null,
            error: null,
            data: null,
            status: RUNNING,
        });

        return this.collector.start()
            .then(() => {
                const start = new Date().getTime();

                this.setState({
                    // Schedule the stoppage.
                    timer: setTimeout(() => this.stop(), this.state.interval),
                    updateInterval: setInterval(() => {
                        const now = new Date().getTime();
                        const percent = (now - start) / this.state.interval;
                        // console.log(percent, 'percent complete');
                        this.setState({ percent: percent >= 1 ? 0.99 : percent });
                    }, 100),
                });
            })
    }

    isRunning() {
        return (this.collector && this.collector.isStarted()) ||
            this.state.status === GATHERING;
    }

    progressMessage() {
        if (this.state.status === ERROR) {
            return `Error: ${this.state.error}`;
        }

        return this.state.status;
    }

    progressBar() {
        return (
            <div className='Progress'>
                <Progress progress
                    error={this.state.status === ERROR}
                    success={this.state.status === GATHERING || this.state.status === STOPPED}
                    percent={Math.round(this.state.percent * 100)}
                    autoSuccess>
                    {this.progressMessage()}
                </Progress>

                {
                    (this.state.status === RUNNING || this.state.status === GATHERING) ?
                        <Spinner text='&nbsp;' /> :
                        ''
                }
            </div>
        );
    }

    filterData() {
        return this.state.includeHalinQueries ?
            this.state.data :
            this.state.data.filter(i => !HalinQuery.isDisclaimed(i.query));
    }

    dataTable() {
        if (!this.state.data) { return ''; }

        return (
            <div className='ViewQueryStats'>
                <QueryStatTable
                    data={this.filterData()}
                    displayColumns={this.state.displayColumns} />
            </div>
        );
    }

    validInterval() {
        const v = Number(this.state.interval);
        return this.state.interval && !Number.isNaN(v) && v > 0;
    }

    handleChange = (meh, { /* name, */ value }) => {
        this.setState({
            interval: value,
        });
    }

    toggleIncludeHalinQueries = () => this.setState({
        includeHalinQueries: !this.state.includeHalinQueries,
    });

    render() {
        return (
            <div className='SampleQueries'>
                <h3>Sample Query Performance <Explainer content={this.help()} /></h3>

                {this.progressBar()}

                <Form>
                    <Form.Group inline>
                        <Form.Field>
                            <Form.Input
                                label='Sample for: (milliseconds)'
                                name='lastN'
                                onChange={this.handleChange}
                                style={{ width: '100px' }}
                                value={this.state.interval} />
                        </Form.Field>

                        <Form.Field>
                            <Checkbox
                                onChange={this.toggleIncludeHalinQueries}
                                label='Show Halin Queries'
                                checked={this.state.includeHalinQueries} />
                        </Form.Field>

                        <Form.Field>
                            <Button primary
                                onClick={() => this.start()}
                                disabled={!this.validInterval() || this.isRunning()}>
                                <Icon name='cogs' />
                                Start Collection
                            </Button>
                        </Form.Field>

                        {this.state.data ?
                            <Form.Field>
                                <CSVDownload
                                    filename={`Halin-querystats-${moment.utc().format()}.csv`}
                                    data={this.filterData()}
                                    displayColumns={this.state.displayColumns} />
                            </Form.Field>
                            : ''}
                    </Form.Group>
                </Form>

                {this.dataTable()}
            </div>
        );
    }
}
