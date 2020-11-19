import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Fetches transaction statistics of how much work the database is processing',
    query: `
    WITH 4.0 AS variant
    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.' + $db + '.transaction.active')
    YIELD attributes WITH attributes.Value.value as open

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.' + $db + '.transaction.active_read')
    YIELD attributes WITH attributes.Value.value as active_read,
        open

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.' + $db + '.transaction.active_write')
    YIELD attributes WITH attributes.Value.value as active_write,
        active_read, open

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.' + $db + '.transaction.committed')
    YIELD attributes WITH attributes.Count.value as committed,
        active_write, active_read, open

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.' + $db + '.transaction.active')
    YIELD attributes WITH attributes.Value.value as active,
        committed, active_write, active_read, open

    CALL dbms.queryJmx("neo4j.metrics:name=neo4j." + $db + ".transaction.peak_concurrent")
    YIELD attributes WITH attributes.Count.value as concurrent,
        active, committed, active_write, active_read, open

    CALL dbms.queryJmx("neo4j.metrics:name=neo4j." + $db + ".transaction.rollbacks")
    YIELD attributes WITH attributes.Count.value as rolledBack,
        concurrent, active, committed, active_write, active_read, open

    CALL dbms.queryJmx("neo4j.metrics:name=neo4j." + $db + ".transaction.started")
    YIELD attributes WITH attributes.Count.value as opened,
        rolledBack, concurrent, active, committed, active_write, active_read, open
        
    RETURN 
        rolledBack,
        open,
        -1 as lastCommittedId, /* 4.0 TODO Not yet supported by neo4j.metrics:name=neo4j.system.transaction.last_committed_tx_id */
        opened,
        concurrent,
        committed,
        active_write,
        active_read,
        active
    `,
    parameters: {
        db: 'Name of the database',
    },
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
