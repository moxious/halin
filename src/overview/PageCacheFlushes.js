import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class PageCacheFlushes extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: queryLibrary.JMX_PAGE_CACHE.query,
        displayProperty: 'flushesPerSecond',
    };

    componentWillMount() {
        this.start = new Date().getTime();
        this.pollStartTime = new Date().getTime();
        this.faultsAsOfLastObservation = -1;
        this.nodeObservations = {};
    }

    // We want to graph page cache faults/sec, not just total count.
    // Remember we have multiple feeds going so this is wrapped in an outer
    // function for the node that this augment function pertains to.
    // This augmentData function gets passed to the data feed and calculates the
    // metric we want (faults per second) on the basis of the metric we can sample
    // from neo4j (total faults)
    augmentData = (node) => (data) => {
        const addr = node.getBoltAddress();

        if (!this.nodeObservations[addr]) {
            // Initialize if needed.
            this.nodeObservations[addr] = {};
        }

        if (this.nodeObservations[addr].last < 0) {
            this.nodeObservations[addr].last = data.faults;
            this.nodeObservations[addr].pollStartTime = new Date().getTime();

            // No previous data to monitor, so start at zero by default.
            return { flushesPerSecond: 0 };
        } 

        // Determine how many faults happened in the past period for this node.
        // Figure out how much time elapsed since the last sample for that node,
        // and then compute the fps.
        const flushesThisPeriod = data.flushes - this.nodeObservations[addr].last;
        const elapsedTimeInSec = (new Date().getTime() - this.nodeObservations[addr].pollStartTime) / 1000;
        const flushesPerSecond = flushesThisPeriod / elapsedTimeInSec;

        /*
        if (addr.match(/node3/)) {
            console.log({
                ftp: faultsThisPeriod,
                lo: this.nodeObservations[addr].last,
                to: data.faults,
                fps: faultsPerSecond,
                elapsedTimeInSec,
            });    
        }
        */

        // Set window values for next go-around.
        this.nodeObservations[addr].last = data.flushes;
        this.nodeObservations[addr].pollStartTime = new Date().getTime();

        const aug = { flushesPerSecond };
        if (addr.match(/node2/)) {
            console.log('AUG FLUSH', data, aug);
        }
        return aug;
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const driver = halin.driverFor(addr);

        const feed = halin.getDataFeed({
            node,
            driver,
            query: this.state.query,
            rate: this.state.rate,
            windowWidth: 1000 * 60 * 5,
            // Get data for a single value only.
            displayColumns: queryLibrary.JMX_PAGE_CACHE.columns,
            params: {},
        });

        feed.addAliases({ flushesPerSecond: ClusterTimeseries.keyFor(addr, this.state.displayProperty) });
        feed.addAugmentationFunction(this.augmentData(node));
        feed.debug = true;
        return feed;
    };

    render() {
        return (
            <div className="PageCacheFlushes">
                <h3>Page Cache Flushes/sec</h3>
                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    debug={false}
                    displayProperty={this.state.displayProperty}
                />
            </div>
        )
    }
}

export default PageCacheFlushes;
