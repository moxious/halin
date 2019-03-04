import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Determines the cluster member\'s role, if in a clustered configuration',
    dependency: {
        type: 'deploy',
        name: 'cluster',
    },
    query: 'CALL dbms.cluster.role() YIELD role RETURN role',
    columns: [
        { Header: 'Role', accessor: 'role' },
    ],
    exampleResult: [ { role: 'FOLLOWER' } ],
    rate: 5000,
});