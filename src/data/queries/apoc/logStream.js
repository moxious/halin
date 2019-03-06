import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver/index';

export default new HalinQuery({
    description: 'Determines whether apoc.log.stream is present, and if the database can send log files back',
    dependency: ctx => ({
        pass: ctx.supportsLogStreaming(),
        description: 'Requires log streaming support (present in recent APOC releases)',
    }),
    query: `
        CALL dbms.procedures() 
        YIELD name 
        WHERE name="apoc.log.stream" 
        RETURN count(name) as n
    `,
    columns: [
        { Header: 'N', accessor: 'n' },
    ],
    exampleResult: [ { n: neo4j.int(1) } ],
});