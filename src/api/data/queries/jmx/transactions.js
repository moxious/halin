import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches transaction statistics of how much work the database is processing',
    query: `
    WITH 'generic' AS variant
    CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Transactions") 
    YIELD attributes WITH attributes as a 
    RETURN 
        a.NumberOfRolledBackTransactions.value as rolledBack, 
        a.NumberOfOpenTransactions.value as open, 
        a.LastCommittedTxId.value as lastCommittedId, 
        a.NumberOfOpenedTransactions.value as opened, 
        a.PeakNumberOfConcurrentTransactions.value as concurrent, 
        a.NumberOfCommittedTransactions.value as committed`,
    columns: [
        { Header: 'Rolled Back', accessor: 'rolledBack' },
        { Header: 'Open', accessor: 'open' },
    ],
    legendOnlyColumns: [
        { Header: 'Peak Concurrent', accessor: 'concurrent' },
        { Header: 'Opened', accessor: 'opened' },
        { Header: 'Committed', accessor: 'committed' },
        { Header: 'Last Committed', accessor: 'lastCommittedId' },
    ],
    rate: 2000,
    exampleResult: [
        {
            rolledBack: 283,
            open: 1,
            lastCommittedId: 7,
            opened: 42929,
            concurrent: 8,
            committed: 42645,
        },
    ],
});
