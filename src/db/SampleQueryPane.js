import React, { Component } from 'react';
import uuid from 'uuid';
import Explainer from '../Explainer';
import DBStats from '../dbstats/DBStats';
import sentry from '../sentry';
import queryLibrary from '../data/query-library';
import ReactTable from 'react-table';
import Spinner from '../Spinner';
import { Button, Progress, Form } from 'semantic-ui-react';

class SampleQueries extends Component {
    state = {
        data: null,
        interval: 5000,
        percent: 0,
        updateInterval: null,
        displayColumns: queryLibrary.DB_QUERY_STATS.columns,
    };

    help() {
        return (
            <div className='SampleQueriesHelp'>
                <p>Neo4j includes built-in procedures that let us monitor query execution plan and
                execution times for queries that run on the system.</p>

                <p>Halin allows temporary sampling of this data for inspecting what is running on 
                    the system at any given time.</p>

                <p>Because Halin itself runs queries against your system, some of its load will
                   appear in the boxes below.
                </p>

                <p>For more information, read about the <pre>db.stats.*</pre>
                <a href="https://neo4j.com/docs/operations-manual/current/reference/procedures/">procedures here</a></p>
            </div>
        );
    }

    stop() {
        return this.collector.stop()
            .then(() => {
                sentry.fine('Stopped collecting');
                return this.collector.stats();
            })
            .then(data => {
                if (this.state.updateInterval) {
                    clearInterval(this.state.updateInterval);
                }

                this.setState({ 
                    data,
                    percent: 1,
                    timer: null,
                    error: null,
                    updateInterval: null,
                });
            })
            .catch(err => {
                sentry.reportError(err, 'When stopping collection');
                this.setState({ data: null, error: err });
            });
    }

    componentWillUnmount() {
        sentry.fine('SampleQuery is unmounting');
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
        }

        if (this.state.timer) {
            clearTimeout(this.state.timer);
        }
    }

    start() {
        if (!this.collector) {
            this.collector = new DBStats(this.props.driver);
        }

        this.setState({
            timer: null,
            progress: 0,
            updateInterval: null,
            error: null,
            data: null,
        });

        return this.collector.start()
            .then(() => {
                const start = new Date().getTime();
                const end = start + this.state.interval;

                this.setState({ 
                    // Schedule the stoppage.
                    timer: setTimeout(() => this.stop(), this.state.interval),
                    updateInterval: setInterval(() => {
                        const now = new Date().getTime();
                        const percent = (now - start) / this.state.interval;
                        console.log(percent, 'percent complete');
                        this.setState({ percent: percent >= 1 ? 0.99 : percent });
                    }, 250),
                });
            })
    }

    isRunning() {
        return this.collector && this.collector.isStarted();
    }

    progressBar() {
        return (
            <div class='Progress'>
                <Progress percent={this.state.percent * 100} autoSuccess />

                <Spinner text='Sampling running queries...Please keep this tab open!' />
            </div>
        );
    }

    dataTable() {
        return (
            <ReactTable
                defaultFilterMethod={(filter, row, column) => {
                    const id = filter.pivotId || filter.id
                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                }}
                sortable={true}
                filterable={true}
                data={this.state.data}
                showPagination={true}
                defaultPageSize={Math.min(this.state.data.length, 10)}
                className="-striped -highlight"
                columns={this.state.displayColumns} />
        );
    }

    validInterval() {
        const v = Number(this.state.interval);
        return this.state.interval && !Number.isNaN(v) && v > 0;
    }

    handleChange = (meh, { name, value }) => {
        this.setState({
            interval: value,
        });
    }

    render() {
        return (
            <div className='SampleQueries'>
                <h3>Sample Query Performance <Explainer content={this.help()}/></h3>

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
                            <Button onClick={() => this.start()} disabled={!this.validInterval() || this.isRunning()}>
                                Start Collection
                            </Button>
                        </Form.Field>
                    </Form.Group>
                </Form>

                { this.isRunning() ? this.progressBar() : '' }

                { this.state.data ? this.dataTable() : '' }
            </div>
        );
    }
}

export default class SampleQueryPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='SampleQueryPane'>
                <SampleQueries
                    key={this.state.key} node={this.props.node} driver={this.props.driver}
                />
            </div>
        )
    }
}