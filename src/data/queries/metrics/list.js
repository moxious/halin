import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches a list of APOC metrics, if supported',
    // Only supported with very recent versions of APOC
    dependency: {
        type: 'procedure',
        name: 'apoc.metrics.list',
    },
    query: `
        CALL apoc.metrics.list() YIELD name, lastUpdated
        RETURN name, lastUpdated
        ORDER BY lastUpdated ASC;
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Last Updated', accessor: 'lastUpdated' },
        { Header: 'Path', accessor: 'path', show: false },
    ],
});