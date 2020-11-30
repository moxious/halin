import React, { Component } from 'react';
import ClusterTimeseries from '../../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import { Dropdown } from 'semantic-ui-react';
import queryLibrary from '../../../api/data/queries/query-library';
import hoc from '../../higherOrderComponents';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import _ from 'lodash';

class PageCacheTracking extends Component {
    state = {
        key: uuid.v4(),
        displayProperty: 'usageRatio',
        min: 0,
        max: 1,
        yAxisFormat: ',.2f',
        options: [
            { format: ',.2f', min: 0, max: 1, key: 'usageRatio', text: 'Usage Ratio', value: 'usageRatio' },
            { format: ',.2f', min: 0, max: 1, key: 'hitRatio', text: 'Hit Ratio', value: 'hitRatio' },

            /* NOTE:  The following extra options are available in Neo4j up to 4.2, but 4.2 removed the JMX metrics needed to
             * track these options. While these are *present in earlier versions* they're being disabled to keep version switching
             * from getting out of hand.
             */
            // { format: null, min: null, max: null, key: 'faultsPerSecond', text: 'Faults/sec', value: 'faultsPerSecond' },
            // { format: null, min: null, max: null, key: 'flushesPerSecond', text: 'Flushes/sec', value: 'flushesPerSecond' },
        ],
    };

    UNSAFE_componentWillMount() {
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
        const feed = halin.getDataFeed(_.merge({ node }, queryLibrary.find(halin, 'pageCache')));

        feed.addAliases({ 
            faultsPerSecond: ClusterTimeseries.keyFor(addr, 'faultsPerSecond'),
            flushesPerSecond: ClusterTimeseries.keyFor(addr, 'flushesPerSecond'), 
            hitRatio: ClusterTimeseries.keyFor(addr, 'hitRatio'),
            usageRatio: ClusterTimeseries.keyFor(addr, 'usageRatio'),
        });
        feed.addAugmentationFunction(this.augmentData(node));

        return feed;
    };

    onChange = (e, data) => {
        const option = this.state.options.filter(o => o.value === data.value)[0];
        const a = {
            displayProperty: data.value,
            min: option.min,
            max: option.max,
            yAxisFormat: option.format,
        };
        this.setState(a);
    };

    render() {
        return (
            <HalinCard header='Page Cache' knowledgebase='PageCache' owner={this}>
                  <Dropdown style={{paddingBottom: 10}}
                        placeholder='Show:'
                        fluid defaultValue='usageRatio'
                        onChange={this.onChange}
                        selection
                        options={this.state.options}
                    />

                <ClusterTimeseries key={this.state.key}
                    min={this.state.min} 
                    max={this.state.max}
                    yAxis={{ format: this.state.yAxisFormat }}
                    feedMaker={this.dataFeedMaker}
                    displayProperty={this.state.displayProperty}
                />
            </HalinCard>
        )
    }
}

export default hoc.neo4j42JMXComponent(
    hoc.enterpriseOnlyComponent(PageCacheTracking, 'Page Cache')
);
