import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches a list of supported functions',
    dependency: null,
    query: `
        WITH 'generic' AS variant
        CALL dbms.functions()
        YIELD name, signature, description
        RETURN name, description, signature
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Signature', accessor: 'signature' },
        { Header: 'Description', accessor: 'description' },
    ],
    exampleResult: [
        {
            name: "time.transaction",
            signature: "time.transaction(timezone = DEFAULT_TEMPORAL_ARGUMENT :: ANY?) :: (TIME?)",
            description: "Get the current Time instant using the transaction clock.",
        },
    ],
});