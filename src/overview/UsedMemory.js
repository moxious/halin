import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class UsedMemory extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: queryLibrary.OS_MEMORY_STATS.query,

        displayColumns: [
            { Header: 'Used', accessor: 'physUsed' },
        ],
    };

    onUpdate = (childQueryState) => {
        // console.log('child query state',childQueryState);
    };

    augmentData = (node) => (data) => {
        const physUsed = data.physTotal - data.physFree;
        return { physUsed };
    };

    keyFor(addr) {
        return `${addr}`.replace(/[^a-zA-Z0-9]/g, '');
    }

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const driver = halin.driverFor(addr);

        const feed = halin.getDataFeed({
            node,
            driver,
            query: this.state.query,
            rate: this.state.rate,
            windowWidth: 1000 * 60 * 5, /* 5 min */
            displayColumns: queryLibrary.OS_MEMORY_STATS.columns,

            // Alias the display property value as a second key (the address)
            // This allows us to pick apart the data in multiple feeds.
            alias: { physUsed: this.keyFor(addr) },
            params: {},
        });

        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    render() {
        return (
            <div className="UsedMemory">
                <h3>Used Physical Memory (bytes)</h3>
                
                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    onUpdate={this.onUpdate}
                    displayProperty={this.state.displayColumns[0].accessor}
                />
            </div>
        )
    }
}

export default UsedMemory;
