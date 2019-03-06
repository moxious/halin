import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Gets roles for a certain user',
    dependency: null,
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