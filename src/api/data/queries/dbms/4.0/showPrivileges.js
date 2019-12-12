import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Gets a list of privileges',
    query: `SHOW PRIVILEGES`,
    bare: true, // Do not disclaim
    columns: [
        { Header: 'Access', accessor: 'access' },
        { Header: 'Action', accessor: 'action' },
        { Header: 'Resource', accessor: 'resource' },
        { Header: 'Graph', accessor: 'graph' },
        { Header: 'Segment', accessor: 'segment' },
        { Header: 'Role', accessor: 'role' },
    ],
    // Because it's from listConfig, value comes as a string **not** a boolean.
    exampleResult: [ 
        {
            grant: 'GRANTED',
            action: 'read',
            resource: 'all_properties',
            graph: '*',
            segment: 'NODE(*)',
            role: 'admin',
        },
    ],
});