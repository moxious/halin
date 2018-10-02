import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';

class GCPauseTime extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx('java.lang:name=G1 Young Generation,type=GarbageCollector') 
            YIELD name, attributes 
            WHERE name =~ '(?i).*garbage.*' 
            WITH attributes.LastGcInfo.value.properties as lastGC 
            
            RETURN 
                /* lastGC.startTime as startTime, */
                lastGC.duration as duration,
                lastGC.GcThreadCount as threadCount
            LIMIT 1;
        `,
    };

    render() {
        return (
            <div className="GCPauseTime">
                <h3>GC Pause Time (ms)</h3>
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
