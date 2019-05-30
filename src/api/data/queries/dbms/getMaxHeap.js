import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Get Neo4j Configuration',
    dependency: null,
    query: `
        CALL dbms.listConfig() 
        YIELD name, value 
        WHERE name='dbms.memory.heap.max_size'
        RETURN name, value
    `,
    columns: [
        {
            Header: 'Name', 
            accessor: 'name',
        },
        { 
            Header: 'Value', 
            accessor: 'value',
        },
    ],
    exampleResult: [
        {
            name: "dbms.memory.heap.max_size",
            value: "1G",
        },
    ],
});