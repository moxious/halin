import React, { Component } from "react";
import "semantic-ui-css/semantic.min.css";
import * as PropTypes from "prop-types";
import _ from 'lodash';

import CypherDataTable from '../data/CypherDataTable';
import 'react-table/react-table.css';

const convertMsToTime = (millis) => {
    if (_.isNil(millis)) { return 'n/a'; }

    let delim = " ";
    let hours = Math.floor(millis / (1000 * 60 * 60) % 60);
    let minutes = Math.floor(millis / (1000 * 60) % 60);
    let seconds = Math.floor(millis / 1000 % 60);
    const hoursStr = hours < 10 ? '0' + hours : hours;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;

    let str = secondsStr + 's';
    if (minutes > 0) { str = minutesStr + delim + str; }
    if (hours > 0) { str = hoursStr + delim + str; }

    return str;
};

const toNumber = val => {
    if(_.isNil(val)) { return 'n/a'; }
    const num = parseInt(val, 10);
    return num.toLocaleString();
};

const jsonField = item =>
    <div className='ActiveQueries_jsonField'>{JSON.stringify(item.value)}</div>;

const numField = item =>
    <div className='ActiveQueries_numberField'>{toNumber(item.value)}</div>;

const timeField = item => 
    <div className='ActiveQueries_timeField'>{convertMsToTime(item.value)}</div>;

class ActiveQueries extends Component {
    query = 'call dbms.listQueries()';
    state = {
        queries: null,
        columns: [
            { Header: 'ID', accessor: 'queryId' },
            { Header: 'Query', accessor: 'query', style: { whiteSpace: 'unset', textAlign: 'left' } },
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

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    render() {
        return (
            <div className="ActiveQueries">
                <h2>Active Queries</h2> 
                <CypherDataTable
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

ActiveQueries.contextTypes = {
    driver: PropTypes.object,
};

export default ActiveQueries;