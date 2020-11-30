import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Clears the DB stats buffer and starts collection',
    dependency: ctx => {
        const v = ctx.getVersion();
        return {
            pass: v.major >= 3 && v.minor >= 5 && v.patch >= 2,
            description: 'Requires Neo4j >= 3.5.2',
        };
    },
    query: `
        WITH 'generic' AS variant
        CALL db.stats.clear('QUERIES') 
        YIELD section 
        RETURN section 
        
        UNION ALL 
        
        CALL db.stats.collect('QUERIES') 
        YIELD section 
        RETURN section;
    `,
    columns: [
        { Header: 'Section', accessor: 'section' },
    ],
    exampleResult: [ 
        { section: 'QUERIES' },
        { section: 'QUERIES' },
    ],
});