import React, { Component } from 'react';
import Explainer from '../Explainer';
import DBStats from '../dbstats/DBStats';
import sentry from '../sentry';
import queryLibrary from '../data/query-library';
import ReactTable from 'react-table';
import Spinner from '../Spinner';
import QueryExecutionPlan from './QueryExecutionPlan';
import { Button, Progress, Form, Modal, Header, Checkbox } from 'semantic-ui-react';

export default class SampleQueries extends Component {
    state = {
        includeHalinQueries: true,
        data: null,
        interval: 2000,
        percent: 0,
        updateInterval: null,
        displayColumns: [
            { 
                Header: 'Plan',
                width: 80,
                Cell: ({ row }) => 
                    <Modal trigger={
                        <Button icon='cogs'/>
                    }>
                        <Header>Query Execution Plan</Header>
                        <Modal.Content>
                            <QueryExecutionPlan data={row}/>
                        </Modal.Content>
                    </Modal>
            },
        ].concat(queryLibrary.DB_QUERY_STATS.columns),
    };

    plan(row) {
        return 'FooPlan';
    }

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

                <p>For more information, read about the <strong>db.stats.*</strong>&nbsp;
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
            <div className='Progress'>
                <Progress percent={this.state.percent * 100} autoSuccess />

                <Spinner text='Sampling running queries...Please keep this tab open!' />
            </div>
        );
    }

    dataTable() {
        // User can select whether or not they want to see Halin stuff.
        const filterData = () => (
            this.state.includeHalinQueries ? 
            this.state.data : 
            this.state.data.filter(i => !queryLibrary.isHalinQuery(i.query)));

        return (
            <ReactTable
                defaultFilterMethod={(filter, row, column) => {
                    const id = filter.pivotId || filter.id
                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                }}
                sortable={true}
                filterable={true}
                data={filterData(this.state.data)}
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

    toggleIncludeHalinQueries = () => this.setState({
        includeHalinQueries: !this.state.includeHalinQueries,
    });

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
                            <Checkbox
                                onChange={this.toggleIncludeHalinQueries}
                                label='Show Halin Queries'
                                checked={this.state.includeHalinQueries} />
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
};
