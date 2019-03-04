import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches a list of supported procedures',
    dependency: null,
    query: `
        CALL dbms.procedures()
        YIELD name, signature, description, roles, mode
        RETURN name, description, signature, roles, mode
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Signature', accessor: 'signature' },
        { Header: 'Description', accessor: 'description' },
        { Header: 'Roles', accessor: 'roles' },
        { Header: 'Mode', accessor: 'mode' },     
    ],
    exampleResult: [
        {
            name: "dbms.getTXMetaData",
            signature: "dbms.getTXMetaData() :: (metadata :: MAP?)",
            description: "Provides attached transaction metadata.",
            roles: ["reader", "editor", "publisher", "architect", "admin"],
            mode: 'DBMS',
        },
    ],
});