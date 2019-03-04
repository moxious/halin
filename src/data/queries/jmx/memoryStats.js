import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver/index';

export default new HalinQuery({
    description: 'Fetches memory utilization statistics using JMX',
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
        heapProps.used + nonHeapProps.used as totalMem`,
    columns: [
        { Header: 'Total Memory', accessor: 'totalMem' },
        { Header: 'Heap Used', accessor: 'heapUsed' },
        { Header: 'Heap Committed', accessor: 'heapCommitted' },
        { Header: 'Nonheap Used', accessor: 'nonHeapUsed' },
    ],
    exampleResult: [
        {
            heapInit: neo4j.int(536870912),
            heapCommitted: neo4j.int(536870912),
            heapUsed: neo4j.int(341835784),
            heapMax: neo4j.int(1073741824),
            nonHeapInit: neo4j.int(2555904),
            nonHeapCommitted: neo4j.int(165609472),
            nonHeapUsed: neo4j.int(161623152),
            nonHeapMax: neo4j.int(-1),
            totalMem: neo4j.int(503458936),
        },
    ],
});
