import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Stops collection of DBStats in the database',
    dependency: ctx => {
        const v = ctx.getVersion();
        return {
            pass: v.major >= 3 && v.minor >= 5 && v.patch >= 2,
            description: 'Requires Neo4j >= 3.5.2',
        };
    },
    query: `
        WITH 'generic' AS variant    
        CALL db.stats.stop("QUERIES") 
        YIELD section, success, message 
        RETURN section, success, message;
    `,
    columns: [
        { Header: 'Section', accessor: 'section' },
        { Header: 'Success', accessor: 'success' },
        { Header: 'Message', accessor: 'message' },
    ],
    exampleResult: [ 
        {
            section: 'QUERIES',
            success: true,
            message: 'Collector is idle, no collection ongoing',
        },
    ],
});