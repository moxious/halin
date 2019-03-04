import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches a list of supported functions',
    dependency: null,
    query: `
        CALL dbms.functions()
        YIELD name, signature, description, roles
        RETURN name, description, signature, roles
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Signature', accessor: 'signature' },
        { Header: 'Description', accessor: 'description' },
        { Header: 'Roles', accessor: 'roles' },        
    ],
    exampleResult: [
        {
            name: "time.transaction",
            signature: "time.transaction(timezone = DEFAULT_TEMPORAL_ARGUMENT :: ANY?) :: (TIME?)",
            description: "Get the current Time instant using the transaction clock.",
            roles: ["admin", "reader", "editor", "publisher", "architect"],
        },
    ],
});