import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import _ from 'lodash';
import moment from 'moment';

export default class ClusterEventLog extends Component {
    state = {
        displayColumns: [
            { 
                Header: 'Date', 
                Cell: e => moment(e.date).format(),
            },
            { 
                Header: 'Message', 
                accessor: 'message',
                style: { whiteSpace: 'unset', textAlign: 'left' },
            },
            { 
                Header: 'Node',
                Cell: e => e.address || 'Cluster-Wide',
            },
        ],
    };

    render() {
        const events = _.sortBy(
            _.clone(window.halinContext.getClusterManager().getEventLog()),
            'date').reverse();

        return (
            <div className='ClusterEventLog'>
                <h3>Cluster Event Log</h3>

                <ReactTable
                    data={events}
                    sortable={true}
                    filterable={true}
                    columns={this.state.displayColumns}
                    defaultPageSize={20}
                />
            </div>
        );
    }
};