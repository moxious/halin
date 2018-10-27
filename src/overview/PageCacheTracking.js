import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import { Button } from 'semantic-ui-react';
import queryLibrary from '../data/query-library';
import hoc from '../higherOrderComponents';
import _ from 'lodash';

class PageCacheTracking extends Component {
    state = {
        key: uuid.v4(),
        width: 400,
        displayProperty: 'usageRatio',
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

        if (_.isNil(this.nodeObservations[addr].lastFaults) || 
            this.nodeObservations[addr].lastFaults < 0) {
            this.nodeObservations[addr].lastFaults = data.faults;
            this.nodeObservations[addr].lastFlushes = data.flushes;
            this.nodeObservations[addr].pollStartTime = new Date().getTime();

            // No previous data to monitor, so start at zero by default.
            return { faultsPerSecond: 0, flushesPerSecond: 0 };
        } 

        // Determine how many faults happened in the past period for this node.
        // Figure out how much time elapsed since the last sample for that node,
        // and then compute the fps.
        const faultsThisPeriod = data.faults - this.nodeObservations[addr].lastFaults;
        const flushesThisPeriod = data.flushes - this.nodeObservations[addr].lastFlushes;

        const elapsedTimeInSec = (new Date().getTime() - this.nodeObservations[addr].pollStartTime) / 1000;
        const faultsPerSecond = faultsThisPeriod / elapsedTimeInSec;
        const flushesPerSecond = flushesThisPeriod / elapsedTimeInSec;

        // Set window values for next go-around.
        this.nodeObservations[addr].lastFaults = data.faults;
        this.nodeObservations[addr].lastFlushes = data.flushes;
        this.nodeObservations[addr].pollStartTime = new Date().getTime();

        const aug = { faultsPerSecond, flushesPerSecond };
        return aug;
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const driver = halin.driverFor(addr);

        const feed = halin.getDataFeed(_.merge({ node, driver }, queryLibrary.JMX_PAGE_CACHE));

        feed.addAliases({ 
            faultsPerSecond: ClusterTimeseries.keyFor(addr, 'faultsPerSecond'),
            flushesPerSecond: ClusterTimeseries.keyFor(addr, 'flushesPerSecond'), 
            hitRatio: ClusterTimeseries.keyFor(addr, 'hitRatio'),
            usageRatio: ClusterTimeseries.keyFor(addr, 'usageRatio'),
        });
        feed.addAugmentationFunction(this.augmentData(node));

        return feed;
    };

    toggleView = (val) => {
        console.log('toggle',val);
        this.setState({ displayProperty: val });
    };

    onUpdate = (data, feed) => {
    };

    render() {
        const buttons = [
            { label: 'Usage Ratio', field: 'usageRatio' },
            { label: 'Hit Ratio', field: 'hitRatio' },
            { label: 'Faults/sec', field: 'faultsPerSecond' },
            { label: 'Flushes/sec', field: 'flushesPerSecond' },
        ];

        return (
            <div className="PageCacheTracking">
                <h3>Page Cache</h3>

                <Button.Group size='tiny' style={{paddingBottom: '15px'}}>{
                    buttons.map((b,idx) =>
                        <Button size='tiny'
                            key={idx}
                            active={this.state.displayProperty===b.field}
                            onClick={() => this.toggleView(b.field)}>
                            { b.label }
                        </Button>)
                }</Button.Group>

                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </div>
        )
    }
}

export default hoc.enterpriseOnlyComponent(PageCacheTracking, 'Page Cache');
