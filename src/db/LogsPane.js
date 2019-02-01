import React, { Component } from 'react';
import uuid from 'uuid';
import hoc from '../higherOrderComponents';
import _ from 'lodash';
import { Tab, Button, Icon, Form, Radio, Input } from 'semantic-ui-react';
import Spinner from '../Spinner';
import ReactTable from 'react-table';
import neo4j from 'neo4j-driver';

const MAX_ROWS = 5000;

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
                } 
            },
        ],
    }

    load() {
        console.log('LogViewer props', this.props);
        console.log(this);

        let query = `
            CALL apoc.file.stream("logs/${this.props.file}") 
            YIELD lineNo, line 
            RETURN lineNo, line
            ORDER BY lineNo DESC LIMIT $limit
        `;

        const params = {
            limit: this.state.partial ? Math.min(this.state.lastN, MAX_ROWS) : MAX_ROWS,
        };
        
        console.log('sending params', params, 'because of', this.state);
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
                            style={{width: '100px'}}
                            value={this.state.lastN} />
                    </Form.Field>

                    <Button icon labelPosition='left' 
                        onClick={() => this.load()} 
                        disabled={!_.isNil(this.state.loadOp)}>
                        <Icon name='download'/>
                        Load
                    </Button>
                </Form>

                { this.state.loadOp ? <Spinner active={true} /> : '' }

                { this.state.data ? 
                <div className='LogViewerTable' style={{paddingTop: '15px'}}><ReactTable
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
                : '' }
            </div>
        );
    }
}

class LogsPane extends Component {
    state = {
        key: uuid.v4(),
    };
    
    viewerFor(file) {
        console.log('LogsPane', this.props);
        return <LogViewer key={file}
            node={this.props.node}
            driver={this.props.driver}
            file={file} />
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
        ];

        return (
            <div className='LogsPane'>
                <Tab menu={{ attached: false, tabular: false }} panes={panes} />
            </div>
        )
    }
}

export default hoc.apocOnlyComponent(LogsPane);