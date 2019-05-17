import React, { Component } from "react";
import { Button, Modal, Header } from 'semantic-ui-react';
import 'react-table/react-table.css';
import 'semantic-ui-css/semantic.min.css';
import _ from 'lodash';
import moment from 'moment';

import queryLibrary from '../../../api/data/queries/query-library';
import fields from '../../../api/data/fields';

import hoc from '../../higherOrderComponents';
import CypherDataTable from '../../data/CypherDataTable/CypherDataTable';
import TaskDetail from './TaskDetail';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

const age = since => {
    const start = moment.utc(since);
    const now = moment.utc();
    const duration = moment.duration(now.diff(start));
    return duration.asSeconds() + ' sec';
};

const createHiddenColumnFromSubfield = (section, subfield) => {
    const accessor = `${section}.${subfield}`;
    return {
        Header: accessor,
        show: false,
        accessor,
    };
};

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
                Cell: e => this.detailModal(e),
            },    
            { 
                Header: 'ID', 
                accessor: 'transaction.id',
                show: true,
            },
            { 
                Header: 'Query', 
                accessor: 'query.query',
                style: { textAlign: 'left' },
                show: true,
            },
            {
                Header: 'Client',
                Cell: ({ row }) => 
                    (   (_.get(row, 'connection.connector') || 'bolt') + '://' + 
                        _.get(row, 'connection.clientAddress') + ' (' + 
                        _.get(row, 'connection.userAgent') + ')'),
            },
            {
                Header: 'Username',
                accessor: 'connection.username',
            },
            {
                Header: 'Age',
                Cell: ({ row }) => age(_.get(row, 'transaction.startTime')),
            },
            {
                Header: 'CPU (ms)',
                accessor: 'transaction.cpuTimeMillis',
                Cell: fields.numField,              
            },
            {
                Header: 'Elapsed(ms)',
                accessor: 'transaction.elapsedTimeMillis',
                Cell: fields.numField,
            },
            {
                Header: 'Idle(ms)',
                accessor: 'transaction.idleTimeMillis',
                Cell: fields.numField,
            },
            {
                Header: 'Wait(ms)',
                accessor: 'transaction.waitTimeMillis',
                Cell: fields.numField,
            },

            { 
                Header: 'Connection', 
                accessor: 'connection', 
                show: false,
                excludeFromCSV: true,
                Cell: fields.jsonField,
            },
            {
                Header: 'Transaction',
                accessor: 'transaction',
                show: false,
                excludeFromCSV: true,
                Cell: fields.jsonField,
            },
            {
                Header: 'QueryDetails',
                accessor: 'query',
                show: false,
                excludeFromCSV: true,
                Cell: fields.jsonField,
            },            

            // All fields below this are hidden by default and not
            // shown to the user, but destructured in this way so
            // that saving as CSV works for this nested structure.

            // CONNECTION PROPERTIES
            ...[
                'id', 'connectTime', 'connector',
                'userAgent', 'serverAddress',
                'clientAddress',
            ].map(sf => createHiddenColumnFromSubfield('connection', sf)),

            // TRANSACTION PROPERTIES
            ...[
                'metaData', 'startTime', 'protocol', 
                'clientAddress', 'requestUri', 'currentQueryId',
                'currentQuery', 'activeLockCount', 'status',
                'resourceInformation', 'elapsedTimeMillis',
                'cpuTimeMillis', 'waitTimeMillis', 'idleTimeMillis',
            ].map(sf => createHiddenColumnFromSubfield('transaction', sf)),

            ...[
                'id', 'parameters', 'planner', 'runtime', 
                'indexes', 'startTime',
                'allocatedBytes', 'pageHits', 'pageFaults',
            ].map(sf => createHiddenColumnFromSubfield('query', sf)),
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
        this.setState({ selected: row });
    };

    detailModal({ row }) {
        return (
            <Modal size='fullscreen' closeIcon
                trigger={
                    <Button compact 
                        disabled={false}
                        onClick={e => this.open(row)}
                        type='submit' icon="info"/>
                }>
                <Header>Query Detail</Header>
                <Modal.Content scrolling>
                    <TaskDetail task={this.state.selected} />
                </Modal.Content>
            </Modal>
        );
    }

    render() {
        return (
            <div className="Tasks">
                <h3>Tasks <Explainer knowledgebase='Tasks'/></h3>
                <CypherDataTable
                    allowDownloadCSV={true}
                    node={this.props.node}
                    query={this.state.query}
                    allowColumnSelect={false}
                    sortable={true}
                    filterable={false}
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.columns}
                    rate={this.rate}
                />
            </div>
        );
    }
}

export default hoc.enterpriseOnlyComponent(Tasks, 'Tasks');