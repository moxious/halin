import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    query: `
        CALL dbms.components()
        YIELD name, versions, edition
        RETURN name, versions, edition
    `,
    columns: [
        { Header: 'Name', accessor: 'name', },
        { Header: 'Versions', accessor: 'versions' },
        { Header: 'Edition', accessor: 'edition' },
    ],
    exampleResults: [
        {
            name: 'Neo4j Kernel',
            versions: ['3.5.3'],
            edition: 'enterprise',
        },
    ],
});