import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches a list of supported procedures',
    dependency: null,
    query: `
        WITH 'generic' AS variant    
        CALL dbms.procedures()
        YIELD name, signature, description, mode
        RETURN name, description, signature, mode
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Signature', accessor: 'signature' },
        { Header: 'Description', accessor: 'description' },
        { Header: 'Mode', accessor: 'mode' },     
    ],
    exampleResult: [
        {
            name: "dbms.getTXMetaData",
            signature: "dbms.getTXMetaData() :: (metadata :: MAP?)",
            description: "Provides attached transaction metadata.",
            mode: 'DBMS',
        },
    ],
});