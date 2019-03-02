import HalinQuery from '../HalinQuery';

export default new HalinQuery({
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
});
