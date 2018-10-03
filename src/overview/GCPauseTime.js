import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class GCPauseTime extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_GARBAGE_COLLECTOR.query,
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
            displayColumns: queryLibrary.JMX_GARBAGE_COLLECTOR.columns,
        });

        return feed;
    };

    render() {
        return (
            <div className="GCPauseTime">
                <h3>Last GC Pause Time (ms)</h3>
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    displayProperty='duration'
                />
            </div>
        )
    }
}

export default GCPauseTime;
