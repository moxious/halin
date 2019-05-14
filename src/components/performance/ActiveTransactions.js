import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';
import queryLibrary from '../data/queries/query-library';
import CypherDataTable from '../data/CypherDataTable';
import fields from '../data/fields';
import { Popup } from 'semantic-ui-react'

import 'react-table/react-table.css';
const cdt = fields;

/**
 * @deprecated by Tasks
 */
class ActiveTransactions extends Component {
    query = 'call dbms.listTransactions()';
    state = {
        query: queryLibrary.DBMS_LIST_TRANSACTIONS.getQuery(),
        columns: [
            { Header: 'TX', accessor: 'transactionId' },
            { Header: 'QId', accessor: 'currentQueryId', show: true },
            { Header: 'CId', accessor: 'connectionId', show: true },
            { Header: 'Status', accessor: 'status' },
            { 
                Header: 'Query', 
                accessor: 'currentQuery', 
                Cell: row => 
                <Popup trigger={<span>{row.value}</span>} content={row.value}/>,
                style: { textAlign: 'left' } 
            },
            { Header: 'Locks', accessor: 'activeLockCount', Cell: cdt.numField },
            { Header: 'User', accessor: 'username' },
            { Header: 'Metadata', accessor: 'metaData', show: false, Cell: cdt.jsonField },
            { Header: 'Start Time', accessor: 'startTime', show: false },
            { Header: 'Protocol', accessor: 'protocol', show: false },
            { Header: 'Client Addr', accessor: 'clientAddress', show: false },
            { Header: 'Request URI', accessor: 'requestUri', show: false },
            { Header: 'Resource Info', accessor: 'resourceInformation', show: false, Cell: cdt.jsonField },
            { Header: 'Idle', accessor: 'idleTimeMillis', Cell: cdt.timeField, show: false },
            { Header: 'Wait', accessor: 'waitTimeMillis', Cell: cdt.timeField },
            { Header: 'CPU', accessor: 'cpuTimeMillis', Cell: cdt.timeField, show: false },
            { Header: 'Elapsed', accessor: 'elapsedTimeMillis', Cell: cdt.timeField },
        ],

        rate: 1000,
    };

    render() {
        return (
            <div className="ActiveTransactions">
                <h2>Active Transactions</h2> 
                <CypherDataTable
                    node={this.props.node}
                    query={this.state.query}
                    allowColumnSelect={true}
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.columns}
                    rate={this.rate}
                />
            </div>
        );
    }
}

export default ActiveTransactions;