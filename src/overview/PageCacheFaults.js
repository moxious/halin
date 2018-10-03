import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class PageCacheFaults extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: queryLibrary.JMX_PAGE_CACHE.query,
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
            return { faultsPerSecond: 0 };
        } 

        // Determine how many faults happened in the past period for this node.
        // Figure out how much time elapsed since the last sample for that node,
        // and then compute the fps.
        const faultsThisPeriod = data.faults - this.nodeObservations[addr].last;
        const elapsedTimeInSec = (new Date().getTime() - this.nodeObservations[addr].pollStartTime) / 1000;
        const faultsPerSecond = faultsThisPeriod / elapsedTimeInSec;

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
        this.nodeObservations[addr].last = data.faults;
        this.nodeObservations[addr].pollStartTime = new Date().getTime();

        return { faultsPerSecond };
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
            displayColumns: [
                { Header: 'faults', accessor: 'faults' },
            ],

            // Alias the display property value as a second key (the address)
            // This allows us to pick apart the data in multiple feeds.
            alias: { faultsPerSecond: ClusterTimeseries.keyFor(addr) },
            params: {},
        });

        feed.addAugmentationFunction(this.augmentData(node));

        return feed;
    };

    render() {
        return (
            <div className="PageCacheFaults">
                <h3>Page Cache Faults</h3>
                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    debug={false}
                    displayProperty='faultsPerSecond'
                />
            </div>
        )
    }
}

export default PageCacheFaults;
