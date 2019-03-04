import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Determines whether or not authorization is enabled on the database',
    query: `
        CALL dbms.listConfig() YIELD name, value
        WHERE name =~ 'dbms.security.auth_enabled'
        RETURN value;
    `,
    columns: [
        { Header: 'Value', accessor: 'value' },
    ],
    // Because it's from listConfig, value comes as a string **not** a boolean.
    exampleResults: [ { value: 'true' } ],
});