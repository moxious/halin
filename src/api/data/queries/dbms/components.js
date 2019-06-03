import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Determines basics about the database such as version of Neo4j and Edition (enterprise or community)',
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
    exampleResult: [
        {
            name: 'Neo4j Kernel',
            versions: ['3.5.3'],
            edition: 'enterprise',
        },
    ],
});