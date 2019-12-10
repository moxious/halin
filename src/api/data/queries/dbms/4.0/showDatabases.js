import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Gets a list of the databases supported by the system',
    query: `SHOW DATABASES`,
    bare: true, // Do not disclaim
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Address', accessor: 'address' },
        { Header: 'Role', accessor: 'role' },        
        { Header: 'Requested Status', accessor: 'requestedStatus' },
        { Header: 'Current Status', accessor: 'currentStatus', },
        { Header: 'Error', accessor: 'error' },
        { Header: 'Default?', accessor: 'default' },
    ],
    // Because it's from listConfig, value comes as a string **not** a boolean.
    exampleResult: [ 
        {
            name: 'neo4j',
            address: '0.0.0.0:7687',
            role: 'standalone',
            requestedStatus: 'online',
            currentStatus: 'online',
            error: '',
            default: true,
        },
        {
            name: 'system',
            address: '0.0.0.0:7687',
            role: 'standalone',
            requestedStatus: 'online',
            currentStatus: 'online',
            error: '',
            default: true,
        },
    ],
});