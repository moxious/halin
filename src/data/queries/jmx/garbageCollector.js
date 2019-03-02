import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    query: `
    CALL dbms.queryJmx('java.lang:name=G1 Young Generation,type=GarbageCollector') 
    YIELD name, attributes 
    WHERE name =~ '(?i).*garbage.*' 
    WITH attributes.LastGcInfo.value.properties as lastGC 
    
    RETURN 
        lastGC.startTime as startTime,
        lastGC.duration as duration,
        lastGC.GcThreadCount as threadCount
    LIMIT 1`,
    columns: [
        { Header: 'Duration', accessor: 'duration' },
        { Header: 'Thread Count', accessor: 'threadCount' },
    ],
});