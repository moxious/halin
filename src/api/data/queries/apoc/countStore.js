import HalinQuery from '../HalinQuery';

const cols = ['labelCount', 'relTypeCount', 'propertyKeyCount',
    'nodeCount', 'relCount', 'labels', 'relTypes', 'relTypesCount', 'stats' ];

export default new HalinQuery({
    description: 'Uses APOC to access the count store',
    dependency: ctx => ({
        pass: ctx.supportsAPOC(),
        description: 'Requires APOC (any version)',
    }),
    query: `
        CALL apoc.meta.stats()
        YIELD ${cols.join(', ')}
        RETURN ${cols.join(', ')}
    `,
    columns: cols.map(c => ({ Header: c, accessor: c })),
});