import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver/index';

export default new HalinQuery({
    query: `
        CALL dbms.procedures() 
        YIELD name 
        WHERE name="apoc.log.stream" 
        RETURN count(name) as n
    `,
    columns: [
        { Header: 'N', accessor: 'n' },
    ],
    exampleResults: [ { n: neo4j.int(1) } ],
});