import React, { Component } from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import moment from 'moment';
import datautil from '../../../api/data/util';
import CSVDownload from '../../data/download/CSVDownload';

export default class DataFeedStats extends Component {
    state = { activeIndex: 0 };

    handleClick = (e, titleProps) => {
        const { index } = titleProps
        const { activeIndex } = this.state
        const newIndex = activeIndex === index ? -1 : index

        this.setState({ activeIndex: newIndex })
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

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.setState({ activeIndex: this.state.activeIndex + 1 }), 1000);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    render() {
        console.log('statsrender');
        const displayColumns = [
            { Header: 'Member', accessor: 'member' },
            { Header: 'Query', accessor: 'query' },
            { Header: 'Best (ms)', accessor: 'best' },
            { Header: 'Avg (ms)', accessor: 'avg' },
            { Header: 'Worst (ms)', accessor: 'worst' },
            { Header: 'Listeners', accessor: 'listeners' },
            { Header: 'Fns', accessor: 'augFns' },
            { Header: 'Aliases', accessor: 'aliases' },
            { Header: 'Packets', accessor: 'packets' },
        ];

        const data = this.dataFeedStats().map((stats, idx) => ({
            member: stats.node.getLabel(),
            query: stats.label,
            best: datautil.roundToPlaces(stats.min, 2),
            avg: datautil.roundToPlaces(stats.mean, 2),
            worst: datautil.roundToPlaces(stats.max, 2),
            listeners: stats.listeners,
            augFns: stats.augFns,
            aliases: stats.aliases,
            packets: stats.packets,
        }));

        return (
            <div>
                <CSVDownload
                    title='Download'
                    filename={`Halin-datafeed-stats-${moment.utc().format()}.csv`}
                    data={data}
                    displayColumns={displayColumns}
                />

                <ReactTable className='-striped -highlight'
                    data={data}
                    defaultFilterMethod={(filter, row /* , column */) => {
                        const id = filter.pivotId || filter.id
                        return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                    }}
                    columns={displayColumns}
                    sortable={true}
                    filterable={true}
                    defaultPageSize={10}
                    showPagination={true}
                />
            </div>
        );
    }
}