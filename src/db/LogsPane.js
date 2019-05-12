import React, { Component } from 'react';
import uuid from 'uuid';
import hoc from '../higherOrderComponents';
import _ from 'lodash';
import { Tab, Button, Icon, Form, Radio, Message } from 'semantic-ui-react';
import Spinner from '../Spinner';
import ReactTable from 'react-table';
import neo4j from 'neo4j-driver';
import sentry from '../sentry';
import le from '../data/logs/LogEvent';
import CSVDownload from '../data/download/CSVDownload';
import moment from 'moment';

console.log('LogEvent', le);

const MAX_ROWS = 5000;

const code = text => <span style={{ fontFamily: 'monospace' }}>{text}</span>;

const style = {
    whitespace: 'unset',
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '0.8em',
};

class LogViewer extends Component {
    state = {
        key: uuid.v4(),
        loadOp: null,
        data: null,
        lastN: 20,
        partial: true,
        rawDisplayColumns: [
            { 
                Header: 'Line', 
                accessor: 'lineNo', 
                width: 50,
                style,
            },
            {
                Header: 'Entry',
                accessor: 'line',
                style,
            },
        ],
        parsedDisplayColumns: [
            {
                Header: 'Timestamp',
                accessor: 'timestamp',
                Cell: ({ row }) => row.timestamp.format(),
                style,
                // width: 150,
            },
            {
                Header: 'Level',
                accessor: 'logLevel',
                style,
                // width: 50,
            },
            {
                Header: 'Class',
                accessor: 'classDesignator',
                style,
            },
            {
                Header: 'Log',
                accessor: 'text',
                style,
            },
        ],
    }

    download() {
        const promise = this.props.node.run(`
            CALL apoc.log.stream("${this.props.file}") YIELD lineNo, line
            RETURN line
            ORDER BY lineNo ASC
        `)
            .then(results => {
                const logFileData = results.records.map(r => r.get('line')).join('\n');

                const blob = new Blob([logFileData], { type: 'text/plain' });
                const dataURI = `data:text/plain;chartset=utf-8,${logFileData}`;

                const URL = window.URL || window.webkitURL;

                this.setState({ loadOp: null, err: null, data: null });

                const toDownload = (typeof URL.createObjectURL === 'undefined') ?
                    dataURI :
                    URL.createObjectURL(blob);

                const link = document.createElement('a')
                link.setAttribute('href', toDownload)
                link.setAttribute('download', this.props.file)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                return toDownload;
            })
            .catch(err => this.promiseErrorHandler(err));

        this.setState({ loadOp: promise });
        return promise;
    }

    promiseErrorHandler(err) {
        const str = `${err}`;

        if (str.indexOf('apoc.log.stream') > -1 && str.indexOf('no procedure')) {
            // This is OK - they don't have the right version of APOC installed to stream files.
            // Not a reportable error though.
            sentry.fine('User does not have right version of APOC installed to stream logs');
            this.unsupported = true;
        } else {
            sentry.reportError('Failed to stream logfile', err);
        }

        console.error('Failed to get log', err);
        this.setState({ err, loadOp: null, data: null });
    }

    load() {
        console.log('LogViewer props', this.props);
        console.log(this);

        let query = `
            CALL apoc.log.stream("${this.props.file}", { last: $n }) 
            YIELD lineNo, line 
            RETURN lineNo, line
            ORDER BY lineNo DESC LIMIT $limit
        `;

        if (!this.state.partial) {
            query = `
                CALL apoc.log.stream("${this.props.file}") 
                YIELD lineNo, line 
                RETURN lineNo, line
                ORDER BY lineNo DESC LIMIT $limit            
            `;
        }

        let n = parseInt(this.state.lastN, 10);
        if (Number.isNaN(n)) { n = 20; }

        const params = { n, limit: MAX_ROWS };
        const promise = this.props.node.run(query, params)
            .then(results => {
                console.log('data came back');

                // Records are in reverse order to only get the last ones.  Re-reverse them.
                const data = neo4j.unpackResults(results, {
                    required: ['lineNo', 'line'],
                }).reverse();

                const events = le.parseLines(data.map(d => d.line));
                this.setState({ err: null, data, events, loadOp: null });
            })
            .catch(err => this.promiseErrorHandler(err));

        this.setState({ loadOp: promise });
    }

    handleChange = (meh, { name, value }) => {
        if (name === 'howMuch') {
            this.setState({
                partial: value === 'partial',
            });
        } else {
            this.setState({ [name]: value });
        }
    }

    troubleshooting() {
        return (
            <div className='LogTroubleshooting'>
                <p>Some installs of Neo4j may use journalctl to access logs, which may not be
                    on disk in their usual locations.
                </p>

                <p>Additionally, to view query.log, please ensure that 
                    <a href="https://neo4j.com/docs/operations-manual/current/monitoring/logging/query-logging/">
                    query logging is enabled.</a>
                </p>
            </div>
        );
    }

    displayError() {
        if (!this.state.err) {
            throw new Error('Only call me when error is in state');
        }

        const strError = `${this.state.err}`;
        const addendum = strError.indexOf('No log file exists by that name') > -1 ? 
            this.troubleshooting() : '';

        return (
            <Message negative>
            <Message.Header>Error Fetching Log File</Message.Header>
                <p>{strError}</p>
                { addendum }
            </Message>
        );
    }

    getData() {
        return this.state.parsed ? this.state.events : this.state.data;
    }

    getDisplayColumns() {
        return this.state.parsed ? this.state.parsedDisplayColumns : this.state.rawDisplayColumns;
    }

    render() {
        const spacer = () => <div style={{ paddingLeft: '15px', paddingRight: '15px' }}>&nbsp;</div>;

        return (
            <div className='LogViewer' key={this.state.key}>
                <h3>{this.props.file}</h3>

                { this.state.err ? this.displayError() : '' }

                <Form>
                    <Form.Field>
                        <Form.Group inline>
                            <Radio
                                label='Everything'
                                name='howMuch'
                                value='everything'
                                checked={!this.state.partial}
                                onChange={this.handleChange}
                            />
                            {spacer()}
                            <Radio
                                label='Last few entries'
                                name='howMuch'
                                value='partial'
                                checked={this.state.partial}
                                onChange={this.handleChange}
                            />
                            {spacer()}
                            <Form.Input
                                name='lastN'
                                onChange={this.handleChange}
                                style={{ width: '100px' }}
                                value={this.state.lastN} />
                            {spacer()}
                            <Button icon labelPosition='left'
                                onClick={() => this.load()}
                                disabled={!_.isNil(this.state.loadOp)}>
                                <Icon name='feed' />
                                Load
                            </Button>
                            <Button icon
                                onClick={() => this.download()}>
                                <Icon name="download" />
                                Download Raw File
                            </Button>
                            { this.state.events ? 
                            <CSVDownload title='Download as CSV'
                                filename={`Halin-${this.props.file}-${moment.utc().format()}.csv`}
                                data={this.state.events}
                                displayColumns={this.state.parsedDisplayColumns} /> : '' }
                        </Form.Group>
                    </Form.Field>
                </Form>

                {this.state.loadOp ? <Spinner active={true} /> : ''}

                {this.state.data ?
                    <div className='LogViewerTable' style={{ paddingTop: '15px' }}><ReactTable
                        defaultFilterMethod={(filter, row, column) => {
                            const id = filter.pivotId || filter.id
                            return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                        }}
                        data={this.getData()}
                        sortable={true}
                        filterable={true}
                        defaultPageSize={Math.min(50, this.state.lastN)}
                        showPagination={!this.state.partial || (this.state.lastN >= 50)}
                        columns={this.getDisplayColumns()}
                    /></div>
                    : ''}
            </div>
        );
    }
}

class LogsPane extends Component {
    state = {
        key: uuid.v4(),
        file: null,
    };

    viewerFor(file) {
        return (
            <LogViewer key={file}
                node={this.props.node}
                file={file} />
        );
    }

    render() {
        const panes = [
            {
                menuItem: 'neo4j.log',
                render: () => {
                    const file = 'neo4j.log';
                    return this.viewerFor(file);
                },
            },
            {
                menuItem: 'debug.log',
                render: () => {
                    const file = 'debug.log';
                    return this.viewerFor(file);
                },
            },
            {
                menuItem: 'security.log',
                render: () => {
                    const file = 'security.log';
                    return this.viewerFor(file);
                },
            },
            {
                menuItem: 'query.log',
                render: () => {
                    const file = 'query.log';
                    return this.viewerFor(file);
                },
            }
        ];

        return (
            <div className='LogsPane'>
                <Tab menu={{ attached: false, tabular: false }} panes={panes} />
            </div>
        )
    }
}

// These are our dependencies...what must be true for this component to work.
const compatCheckFn = ctx =>
    Promise.resolve(ctx.supportsAPOC() && ctx.supportsLogStreaming());

// This is what to tell the user if the compatibility checks aren't satisfied.
const notSupported = () => {
    return (
        <Message warning>
            <Message.Header>Additional Configuration Needed</Message.Header>
            <Message.Content>
                <p>In order to view logs in Halin, some additional configuration of your Neo4j
                   instance is necessary.</p>

                <ul style={{ textAlign: 'left' }}>
                    <li>Ensure that you have <a href='https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases'>APOC installed</a>&nbsp;
                        <strong>and that it is a recent version</strong> higher than 3.5.0.3 for Neo4j 3.5, or 3.4.0.6 for Neo4j 3.4</li>
                    <li>Ensure that your {code('neo4j.conf')} includes {code('apoc.import.file.enabled=true')}, which
                    will permit access to the metrics.</li>
                </ul>
            </Message.Content>
        </Message>
    );
};

export default hoc.compatibilityCheckableComponent(
    LogsPane,
    compatCheckFn,
    notSupported);