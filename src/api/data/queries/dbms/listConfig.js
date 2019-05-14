import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Get Neo4j Configuration',
    dependency: null,
    query: `
        CALL dbms.listConfig() 
        YIELD name, description, value 
        RETURN name, description, value
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
        { 
            Header: 'Description', 
            accessor: 'description',
            style: { whiteSpace: 'unset' }, // Permits text wrapping.
        },
    ],
    exampleResult: [
        {
            name: "bolt.ssl_policy",
            description: "Specify the SSL policy to use for the encrypted bolt connections.",
            value: "legacy",
        },
        {
            name: "browser.credential_timeout",
            description: "Configure the Neo4j Browser to time out logged in users after this idle period. Setting this to 0 indicates no limit.",
            value: "0ms",   
        },
    ],
});