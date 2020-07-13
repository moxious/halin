import React, { Component } from 'react';
import ClusterTimeseries from '../../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../../api/data/queries/query-library';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import util from '../../../api/data/util';
import _ from 'lodash';

class ClusterMemory extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        query: queryLibrary.JMX_MEMORY_STATS.query,
    };

    render() {
        const stats = window.halinContext.getMemberSet().getStats() || {};
        const writerStats = stats[window.halinContext.getWriteMember().getBoltAddress()];
        const heapCommitted = _.get(writerStats, 'heapCommitted');

        const header = 'Heap Size (' + 
            (heapCommitted ? util.humanDataSize(heapCommitted) : 'unknown') + ' committed)';

        return (
            <HalinCard header={header} knowledgebase='ClusterMemory' owner={this}>
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    rate={this.state.rate}
                    displayProperty='heapUsed'
                />
            </HalinCard>
        )
    }
}

export default ClusterMemory;
