import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Gets a list of the databases supported by the system',
    query: `SHOW DATABASES;`,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Status', accessor: 'status' },
        { Header: 'Default?', accessor: 'default' },
    ],
    // Because it's from listConfig, value comes as a string **not** a boolean.
    exampleResult: [ 
        {
            name: 'neo4j',
            status: 'online',
            default: true,
        },
        {
            name: 'system',
            status: 'online',
            default: true,
        },
    ],
});