import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Clears the DB stats buffer and starts collection',
    query: `
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