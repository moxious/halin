import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Gets the authorization provider of the database, e.g. native or LDAP',
    query: `
        CALL dbms.listConfig() YIELD name, value 
        WHERE name =~ 'dbms.security.auth_provider.*' 
        RETURN value;
    `,
    columns: [
        { Header: 'Value', accessor: 'value' },
    ],
    // Because it's from listConfig, value comes as a string **not** a boolean.
    exampleResults: [ { value: 'native' } ],
});