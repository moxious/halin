import React, { Component } from 'react';
import _ from 'lodash';
import ReactTable from 'react-table';

import datautil from '../../../api/data/util';

export default class DataFeedStats extends Component {
    state = {
        displayColumns: [
            {
                Header: 'Member',
                id: 'member',
                accessor: (row) => {
                    console.log('ROW', row);
                    return row.node.getLabel();
                }
            },
            {
                Header: 'Feed',
                id: 'feed',
                accessor: 'label'
            },
            {
                Header: 'Rate (ms)',
                accessor: 'rate',
            },
            {
                Header: 'Best (ms)',
                id: 'min',
                accessor: (row) => datautil.roundToPlaces(row.min, 2)
            },
            {
                Header: 'Worst (ms)',
                id: 'max',
                accessor: (row) => datautil.roundToPlaces(row.max, 2)
            },
            {
                Header: 'Avg (ms)',
                id: 'mean',
                accessor: (row) => datautil.roundToPlaces(row.mean, 2)
            },
            {
                Header: 'Listeners',
                accessor: 'listeners',
            },
            {
                Header: 'Augmentation Functions',
                accessor: 'augFns',
            },
            {
                Header: 'Aliases',
                accessor: 'aliases',
            },
            {
                Header: 'Packets',
                accessor: 'packets',
            },
        ],
    };

    dataFeedStats() {
        const halin = window.halinContext;
        const feedStats = _.values(halin.dataFeeds).map(feed => {
            // Add a node field so the renderer can figure out where these came from.
            return _.merge({ node: feed.node }, feed.stats());
        });

        return _.sortBy(feedStats, ['address', 'label']);
    }

    lineChartData(timings) {
        return {
            label: 'Response Time',
            values: timings.map((timing, idx) => ({
                x: idx, y: timing,
            })),
        };
    }

    render() {
        return (
            <ReactTable className='-striped -highlight'
                data={this.dataFeedStats()}
                // By default, filter only catches data if the value STARTS WITH
                // the entered string.  This makes it less picky.
                defaultFilterMethod={(filter, row /* , column */) => {
                    const id = filter.pivotId || filter.id
                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                }}

                sortable={true}
                filterable={true}
                defaultPageSize={20}
                showPagination={true}
                columns={this.state.displayColumns}
            />
        );
    }
}