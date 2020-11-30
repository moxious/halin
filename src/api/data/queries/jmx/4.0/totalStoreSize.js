import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Fetches total size of the database as stored on disk',
    // otherStore is a calculated value that catches all other files which may
    // be in the store directory which don't belong to Neo4j.
    query: `
        WITH 4.0 as variant
        CALL dbms.queryJmx("neo4j.metrics:name=neo4j." + $db + ".store.size.total") 
        YIELD attributes 
        RETURN attributes.Value.value AS sizeInBytes
    `,
    parameters: {
        db: 'Database name',
    },
    columns: [
        { Header: 'Size in Bytes', accessor: 'sizeInBytes' },
    ],
    rate: 1000,
    exampleResult: [
        {
            sizeInBytes: 1024,
        },
    ],
});