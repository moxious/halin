import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver/index';

export default new HalinQuery({
    description: 'Fetches last committed transaction ID',
    query: `
    CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Transactions") 
    YIELD attributes 
    RETURN attributes["LastCommittedTxId"].value as value`,
    columns: [
        { Header: 'Last Committed TX ID', accessor: 'value' },
    ],
    exampleResult: [
        {
            value: neo4j.int(77942),
        },
    ],
});
