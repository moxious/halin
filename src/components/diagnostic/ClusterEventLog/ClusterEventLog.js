import React, { Component } from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import moment from 'moment';

class ClusterEventLog extends Component {
    state = {
        displayColumns: [
            { 
                Header: 'Date', 
                Cell: e => moment(e.date).format(),
            },
            {
                Header: 'Type',
                accessor: 'type',
            },
            { 
                Header: 'Message', 
                accessor: 'message',
                style: { whiteSpace: 'unset', textAlign: 'left' },
            },
            { 
                Header: 'Member',
                accessor: 'address',
            },
        ],
    };

    render() {
        const events = _.sortBy(
            _.clone(window.halinContext.getClusterManager().getEventLog()),
            'date').reverse();
        // console.log('CEV items', events);
        return (
            <div className='ClusterEventLog'>
                <h3>Event Log</h3>

                <ReactTable className='-striped -highlight'
                    data={events}
                    sortable={true}
                    filterable={true}
                    columns={this.state.displayColumns}
                    defaultPageSize={8}
                />
            </div>
        );
    }
}

export default ClusterEventLog;
