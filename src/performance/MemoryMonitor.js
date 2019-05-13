import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import Explainer from '../Explainer';

class MemoryMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_MEMORY_STATS.query,
        displayColumns: queryLibrary.JMX_MEMORY_STATS.columns,
    };

    render() {
        const explainer = <Explainer knowledgebase='Memory' />;

        return (
            <div className="MemoryMonitor">
                <CypherTimeseries key={this.state.key}
                    node={this.props.node}
                    explainer={explainer}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    startingEnabled={[this.state.displayColumns[1]]}
                    displayColumns={this.state.displayColumns}
                />
            </div>
        )
    }
}

export default MemoryMonitor;
