import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';
import hoc from '../../higherOrderComponents';
import queryLibrary from '../../data/queries/query-library';
import CypherDataTable from '../../data/CypherDataTable';
import fields from '../../data/fields';
import 'react-table/react-table.css';
import { Grid, Button, Popup } from 'semantic-ui-react';
import TaskDetail from './TaskDetail';

class Tasks extends Component {
    state = {
        // The 3.4 version of this query doesn't have as much info, but works.
        query: queryLibrary.DBMS_34_TASKS.getQuery(),
        selected: null,
        columns: [
            {
                Header: 'Inspect',
                id: 'delete',
                minWidth: 70,
                maxWidth: 100,
                Cell: ({ row }) => (
                    <Button compact 
                        disabled={false}
                        onClick={e => this.open(row)}
                        type='submit' icon="info"/>
                ),
            },    
            { 
                Header: 'ID', 
                accessor: 'id',
                show: false,
            },
            { 
                Header: 'Query', 
                accessor: 'query.query',
                Cell: row => 
                    <Popup trigger={<span>{row.value}</span>} content={row.value}/>,
                style: { textAlign: 'left' },
                show: true,
            },
            { 
                Header: 'Connection', 
                accessor: 'connection', 
                show: false,
                Cell: fields.jsonField,
            },
            {
                Header: 'Transaction',
                accessor: 'transaction',
                show: false,
                Cell: fields.jsonField,
            },
            {
                Header: 'QueryDetails',
                accessor: 'query',
                show: false,
                Cell: fields.jsonField,
            },
        ],
        rate: 1000,
    };

    componentWillMount() {
        // We use a different query according to supported features if 3.5 is present.
        const version = window.halinContext.getVersion();
        if (version.major >= 3 && version.minor >= 5) {
            this.setState({
                query: queryLibrary.DBMS_35_TASKS.getQuery()
            });
        }
    }

    open = (row) => {
        console.log('Clicked row',row);
        this.setState({ selected: row });
    };

    render() {
        return (
            <div className="Tasks">
                <h2>Tasks</h2>
                <Grid divided='vertically'>
                    <Grid.Row columns={16}>
                        <Grid.Column width={8}>
                            <CypherDataTable
                                node={this.props.node}
                                query={this.state.query}
                                allowColumnSelect={false}
                                sortable={true}
                                filterable={false}
                                refresh={this.state.childRefresh}
                                displayColumns={this.state.columns}
                                rate={this.rate}
                            />
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <TaskDetail task={this.state.selected} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

            </div>
        );
    }
}

export default hoc.enterpriseOnlyComponent(Tasks, 'Tasks');