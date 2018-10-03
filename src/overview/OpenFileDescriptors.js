import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';

class OpenFileDescriptors extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: `
        CALL dbms.queryJmx("java.lang:type=OperatingSystem") 
        YIELD attributes 
        WITH
            attributes.OpenFileDescriptorCount.value as fdOpen,
            attributes.MaxFileDescriptorCount.value as fdMax
        RETURN 
            fdOpen, fdMax`,
        displayColumns: [
            { Header: 'fdOpen', accessor: 'fdOpen' },
            { Header: 'fdMax', accessor: 'fdMax' },
        ],
        displayProperty: 'fdUsed',
    };

    onUpdate = (childQueryState) => {
        // console.log('child query state',childQueryState);
    };

    // JMX gives us maximum FDs and open FDs, but we want number of used FDs,
    // so we have to augment the data structure because the timeseries doesn't do math
    // for us.
    augmentData = (node) => (data) => {
        const fdUsed = data.fdMax - data.fdOpen;
        return { fdUsed };
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
            windowWidth: 1000 * 60 * 5, /* 5 min */
            displayColumns: this.state.displayColumns,

            // Alias the display property value as a second key (the address)
            // This allows us to pick apart the data in multiple feeds.
            alias: { fdUsed: ClusterTimeseries.keyFor(addr, this.state.displayProperty) },
            params: {},
        });

        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    render() {
        return (
            <div className="OpenFileDescriptors">
                <h3>Open File Descriptors</h3>
                
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

export default OpenFileDescriptors;
