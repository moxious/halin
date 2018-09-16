import React, { Component } from "react";
import "semantic-ui-css/semantic.min.css";
import * as PropTypes from "prop-types";
import _ from 'lodash';

import ReactTable from 'react-table';
import 'react-table/react-table.css';

const neo4j = require("neo4j-driver/lib/browser/neo4j-web.min.js").v1;

const rate = 1000; // every second

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
            { Header: 'Status', accessor: 'status' },
            { Header: 'Idle', accessor: 'idleTimeMillis', Cell: timeField },
            { Header: 'Wait', accessor: 'waitTimeMillis', Cell: timeField },
            { Header: 'CPU', accessor: 'cpuTimeMillis', Cell: timeField },
            { Header: 'Elapsed', accessor: 'elapsedTimeMillis', Cell: timeField },
            { Header: 'Locks', accessor: 'activeLockCount', Cell: numField },
            { Header: 'Bytes', accessor: 'allocatedBytes', Cell: numField },
            { Header: 'PageHits', accessor: 'pageHits', Cell: numField },
            { Header: 'PageFaults', accessor: 'pageFaults', Cell: numField },
        ],
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    sampleQueries() {
        if (!this.mounted) { return false; }

        const session = this.driver.session();

        return session.run(this.query, {})
            .then(results => {
                const queries = results.records.map(record => {
                    const fields = [
                        'queryId', 'username', 'metaData', 'query',
                        'parameters', 'planner', 'runtime', 'indexes',
                        'startTime', 'protocol', 'clientAddress',
                        'idleTimeMillis', 'waitTimeMillis', 
                        'requestUri', 'cpuTimeMillis',
                        'resourceInformation', 'status', 'elapsedTimeMillis',
                        'activeLockCount', 'resourceInformation',
                        'allocatedBytes', 'pageHits', 'pageFaults',
                    ];

                    const map = {};
                    fields.forEach(field => {
                        const val = record.get(field);
                        
                        map[field] = neo4j.isInt(val) ? 
                            neo4j.integer.toNumber(val) 
                            : record.get(field);
                    });

                    return map;
                });

                if (this.mounted) {
                    this.setState({ queries });
                    this.timeout = setTimeout(() => this.sampleQueries(), rate);
                }
            })
            .catch(err => {
                console.error('Failed to sample queries', err);
            })
    }

    componentDidMount() {
        this.mounted = true;
        this.sampleQueries();
    }

    componentWillUnmount() {
        this.mounted = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    render() {
        return this.state.queries ? (
            <div className="ActiveQueries">
                <h2>Active Queries</h2> 
                <ReactTable 
                    data={this.state.queries}
                    sortable={true}
                    filterable={true}
                    columns={this.state.columns}
                />
            </div>
        ) : 'Loading...';
    }
}

ActiveQueries.contextTypes = {
    driver: PropTypes.object,
};

export default ActiveQueries;