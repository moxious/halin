import React, { Component } from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import moment from 'moment';

import Explainer from '../../ui/scaffold/Explainer/Explainer';
import CSVDownload from '../../data/download/CSVDownload';

class ClusterEventLog extends Component {
    state = {
        displayColumns: [
            { 
                Header: 'Date', 
                Cell: e => moment(e.date).format(),
                accessor: 'date',
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

        return (
            <div className='ClusterEventLog'>
                <h3>Event Log <Explainer knowledgebase='EventLog' /></h3>

                <CSVDownload 
                    title="Results"
                    data={events}
                    displayColumns={this.state.displayColumns}
                    filename={`Halin-event-log-${moment.utc().format()}.csv`} />

                <ReactTable style={{marginTop:15}} className='-striped -highlight'
                    data={events}
                    sortable={true}
                    filterable={true}
                    columns={this.state.displayColumns}
                    showPagination={events.length > 10}
                    defaultPageSize={Math.min(events.length, 10)}
                />
            </div>
        );
    }
}

export default ClusterEventLog;
