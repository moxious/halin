import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';
import { Popup } from 'semantic-ui-react'
import hoc from '../higherOrderComponents';
import CypherDataTable from '../data/CypherDataTable';
import fields from '../data/fields';
import 'react-table/react-table.css';

const jsonField = fields.jsonField;
const numField = fields.numField;
const timeField = fields.timeField;

/**
 * @deprecated by Tasks
 */
class ActiveQueries extends Component {
    query = 'call dbms.listQueries()';
    state = {
        queries: null,
        columns: [
            { Header: 'ID', accessor: 'queryId' },
            { 
                Header: 'Query', 
                accessor: 'query',
                Cell: row => 
                    <Popup trigger={<span>{row.value}</span>} content={row.value}/>,
                style: { textAlign: 'left' } 
            },
            { Header: 'User', accessor: 'username' },
            { Header: 'Metadata', accessor: 'metaData', show: false, Cell: jsonField },
            { Header: 'Parameters', accessor: 'parameters', show: false, Cell: jsonField },
            { Header: 'planner', accessor: 'planner', show: false },
            { Header: 'Runtime', accessor: 'runtime', show: false },
            { Header: 'Indexes', accessor: 'indexes', show: false, Cell: jsonField },
            { Header: 'Start Time', accessor: 'startTime', show: false },
            { Header: 'Protocol', accessor: 'protocol', show: false },
            { Header: 'Client Addr', accessor: 'clientAddress', show: false },
            { Header: 'Request URI', accessor: 'requestUri', show: false },
            { Header: 'Resource Info', accessor: 'resourceInformation', show: false, Cell: jsonField },
            { Header: 'Status', accessor: 'status' },
            { Header: 'Idle', accessor: 'idleTimeMillis', Cell: timeField, show: false },
            { Header: 'Wait', accessor: 'waitTimeMillis', Cell: timeField },
            { Header: 'CPU', accessor: 'cpuTimeMillis', Cell: timeField, show: false },
            { Header: 'Elapsed', accessor: 'elapsedTimeMillis', Cell: timeField },
            { Header: 'Locks', accessor: 'activeLockCount', Cell: numField },
            { Header: 'Bytes', accessor: 'allocatedBytes', Cell: numField, show: false },
            { Header: 'PageHits', accessor: 'pageHits', Cell: numField },
            { Header: 'PageFaults', accessor: 'pageFaults', Cell: numField },
        ],
        rate: 1000,
    };

    render() {
        return (
            <div className="ActiveQueries">
                <h2>Active Queries</h2> 
                <CypherDataTable
                    node={this.props.node}
                    query={this.query}
                    allowColumnSelect={true}
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.columns}
                    rate={this.rate}
                />
            </div>
        );
    }
}

export default hoc.enterpriseOnlyComponent(ActiveQueries, 'Active Queries');