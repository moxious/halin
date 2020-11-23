import HalinQuery from '../HalinQuery';
import column from '../column';

export default new HalinQuery({
    description: 'Determines whether or not the database has CSV metrics enabled',
    dependency: ctx => ({
        pass: ctx.supportsMetrics(),
        description: 'Requires CSV Metrics Support (present in recent APOC releases)',
    }),
    query: `
        WITH 'generic' AS variant
        CALL dbms.listConfig() 
        YIELD name, value 
        WHERE name='metrics.csv.enabled' 
        return value;
    `,
    columns: ['value'].map(column),
    exampleResult: [ { value: true } ],
});