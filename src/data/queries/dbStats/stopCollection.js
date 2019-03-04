import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Stops collection of DBStats in the database',
    query: `
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