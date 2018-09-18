import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class MemoryMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx('java.lang:type=Memory') yield attributes 
            WITH 
                attributes.HeapMemoryUsage as heap, 
                attributes.NonHeapMemoryUsage as nonHeap

            WITH 
                heap.value.properties as heapProps,
                nonHeap.value.properties as nonHeapProps
            
            return 
                heapProps.init as heapInit, 
                heapProps.committed as heapCommitted,
                heapProps.used as heapUsed, 
                heapProps.max as heapMax,
                nonHeapProps.init as nonHeapInit,
                nonHeapProps.committed as nonHeapCommitted,
                nonHeapProps.used as nonHeapUsed,
                nonHeapProps.max as nonHeapMax,
                heapProps.used + nonHeapProps.used as totalMem
        `,

        displayColumns: [
            { Header: 'Total Memory', accessor: 'totalMem' },
            { Header: 'Heap Used', accessor: 'heapUsed' },
            { Header: 'Heap Committed', accessor: 'heapCommitted' },
            { Header: 'Nonheap Used', accessor: 'nonHeapUsed' },
        ],
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
