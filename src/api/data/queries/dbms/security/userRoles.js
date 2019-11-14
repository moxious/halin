import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Gets roles for a certain user',
    dependency: null,
    bare: true, // Do not disclaim; under Neo4j 4.0 MR3, the disclaimed query fails!
    query: `
        CALL dbms.security.listRolesForUser($username) 
        YIELD value 
        RETURN value;
    `,
    parameters: {
        username: 'The username whose roles you want',
    },
    columns: [
        { Header: 'Value', accessor: 'value' },
    ],
    exampleResult: [
        {
            value: "admin",
        },
    ],
});