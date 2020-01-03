import React, { Component } from 'react';
import CypherTimeseries from '../../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../../api/data/queries/query-library';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

class MemoryMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        query: queryLibrary.JMX_MEMORY_STATS.query,
        displayColumns: queryLibrary.JMX_MEMORY_STATS.columns,
    };

    render() {
        const explainer = <Explainer knowledgebase='Memory' />;

        return (
            <HalinCard owner={this}>
                <CypherTimeseries key={this.state.key}
                    heading="Memory Monitor"
                    node={this.props.member}
                    explainer={explainer}
                    query={this.state.query} 
                    rate={this.state.rate}
                    startingEnabled={[this.state.displayColumns[1]]}
                    displayColumns={this.state.displayColumns}
                />
            </HalinCard>
        );
    }
}

export default MemoryMonitor;
