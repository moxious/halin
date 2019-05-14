import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver/index';
import column from '../column';

export default new HalinQuery({
    description: 'Fetches statistics about garbage collection performance',
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
    columns: ['duration', 'threadCount'].map(column),
    exampleResult: [
        { startTime: neo4j.int(320938), duration: neo4j.int(18), threadCount: neo4j.int(18) },
    ],
});