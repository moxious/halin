import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../api/data/queries/query-library';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';

class ClusterMemory extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_MEMORY_STATS.query,
    };

    render() {
        return (
            <HalinCard header='Heap Size' knowledgebase='ClusterMemory' owner={this}>
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    displayProperty='heapUsed'
                />
            </HalinCard>
        )
    }
}

export default ClusterMemory;
