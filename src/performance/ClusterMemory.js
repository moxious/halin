import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';

class ClusterMemory extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx('java.lang:type=Memory') yield attributes 
            WITH 
                attributes.HeapMemoryUsage as heap
            WITH 
                heap.value.properties as heapProps        
            return 
                heapProps.used as heapUsed
        `,
    };

    render() {
        return (
            <div className="ClusterMemory">
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    displayProperty='heapUsed'
                />
            </div>
        )
    }
}

export default ClusterMemory;
