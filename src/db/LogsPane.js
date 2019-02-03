import React, { Component } from 'react';
import uuid from 'uuid';
import hoc from '../higherOrderComponents';
import _ from 'lodash';
import { Tab, Button, Icon, Form, Radio, Message } from 'semantic-ui-react';
import Spinner from '../Spinner';
import ReactTable from 'react-table';
import neo4j from 'neo4j-driver';
import sentry from '../sentry';

const MAX_ROWS = 5000;

const code = text => <span style={{fontFamily:'monospace'}}>{text}</span>;

class LogViewer extends Component {
    state = {
        key: uuid.v4(),
        loadOp: null,
        data: null,
        lastN: 20,
        partial: true,
        displayColumns: [
            { Header: 'Line', accessor: 'lineNo', width: 70 },
            {
                Header: 'Entry',
                accessor: 'line',
                style: {
                    whiteSpace: 'unset',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '0.8em',
                }
            },
        ],
    }

    load() {
        console.log('LogViewer props', this.props);
        console.log(this);

        let query = `
            CALL apoc.file.stream("logs/${this.props.file}", { last: $n }) 
            YIELD lineNo, line 
            RETURN lineNo, line
            ORDER BY lineNo DESC LIMIT $limit
        `;

        if (!this.state.partial) {
            query = `
                CALL apoc.file.stream("logs/${this.props.file}") 
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
                const data = results.records.map(r => ({
                    lineNo: neo4j.integer.inSafeRange(r.get('lineNo')) ? r.get('lineNo').toNumber() : neo4j.integer.toString(r.get('lineNo')),
                    line: r.get('line'),
                })).reverse();

                this.setState({ err: null, data, loadOp: null });
            })
            .catch(err => {
                const str = `${err}`;

                if (str.indexOf('apoc.file.stream') > -1 && str.indexOf('no procedure')) {
                    // This is OK - they don't have the right version of APOC installed to stream files.
                    // Not a reportable error though.
                    sentry.fine('User does not have right version of APOC installed to stream logs');
                    this.unsupported = true;
                } else {
                    sentry.reportError('Failed to stream logfile', err);
                }

                console.error('Failed to get log', err);
                this.setState({ err, loadOp: null, data: null });
            });

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

    render() {
        return (
            <div className='LogViewer' key={this.state.key}>
                <h3>{this.props.file}</h3>

                <Form>
                    <Form.Field>
                        <Radio
                            label='Everything'
                            name='howMuch'
                            value='everything'
                            checked={!this.state.partial}
                            onChange={this.handleChange}
                        />
                    </Form.Field>

                    <Form.Field inline>
                        <Radio
                            label='Last few entries'
                            name='howMuch'
                            value='partial'
                            checked={this.state.partial}
                            onChange={this.handleChange}
                        />
                        <Form.Input
                            name='lastN'
                            onChange={this.handleChange}
                            style={{ width: '100px' }}
                            value={this.state.lastN} />
                    </Form.Field>

                    <Button icon labelPosition='left'
                        onClick={() => this.load()}
                        disabled={!_.isNil(this.state.loadOp)}>
                        <Icon name='feed' />
                        Load
                    </Button>
                </Form>

                {this.state.loadOp ? <Spinner active={true} /> : ''}

                {this.state.data ?
                    <div className='LogViewerTable' style={{ paddingTop: '15px' }}><ReactTable
                        defaultFilterMethod={(filter, row, column) => {
                            const id = filter.pivotId || filter.id
                            return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                        }}
                        data={this.state.data}
                        sortable={true}
                        filterable={true}
                        defaultPageSize={Math.min(50, this.state.lastN)}
                        showPagination={!this.state.partial || (this.state.lastN >= 50)}
                        columns={this.state.displayColumns}
                    /></div>
                    : ''}
            </div>
        );
    }
}

class LogsPane extends Component {
    state = {
        key: uuid.v4(),
    };

    viewerFor(file) {
        return (
            <LogViewer key={file}
                node={this.props.node}
                driver={this.props.driver}
                file={file} />
        );
    }

    render() {
        const panes = [
            {
                menuItem: 'neo4j.log',
                render: () => this.viewerFor('neo4j.log'),
            },
            {
                menuItem: 'debug.log',
                render: () => this.viewerFor('debug.log'),
            },
            {
                menuItem: 'security.log',
                render: () => this.viewerFor('security.log'),
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
    Promise.resolve(ctx.supportsAPOC() && ctx.supportsFileStreaming());

// This is what to tell the user if the compatibility checks aren't satisfied.
const notSupported = () => {
    return (
        <Message warning>
            <Message.Header>Additional Configuration Needed</Message.Header>
            <Message.Content>
                <p>In order to view logs in Halin, some additional configuration of your Neo4j
                   instance is necessary.</p>

                <ul style={{ textAlign: 'left' }}>
                    <li>Ensure that you have <a href='https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases'>APOC installed</a>
                        <strong>and that it is a recent version</strong> higher than 3.5.01 for Neo4j 3.5, or 3.4.0.4 for Neo4j 3.4</li>
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