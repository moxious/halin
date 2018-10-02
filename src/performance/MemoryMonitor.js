import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class MemoryMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_MEMORY_STATS.query,
        displayColumns: queryLibrary.JMX_MEMORY_STATS.columns,
    };

    render() {
        return (
            <div className="MemoryMonitor">
                <CypherTimeseries key={this.state.key}
                    driver={this.props.driver}
                    node={this.props.node}
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
