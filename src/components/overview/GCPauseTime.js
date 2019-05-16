import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../api/data/queries/query-library';
import _ from 'lodash';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';

class GCPauseTime extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_GARBAGE_COLLECTOR.query,
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;
        const feed = halin.getDataFeed(_.merge({ node }, queryLibrary.JMX_GARBAGE_COLLECTOR));
        return feed;
    };

    render() {
        return (
            <HalinCard header='Last GC Pause Time' knowledgebase='GarbageCollection' owner={this}>
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    displayProperty='duration'
                    chartType='scatter'
                />
            </HalinCard>
        )
    }
}

export default GCPauseTime;
