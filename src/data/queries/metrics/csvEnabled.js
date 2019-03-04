import HalinQuery from '../HalinQuery';
import column from '../column';

export default new HalinQuery({
    description: 'Determines whether or not the database has CSV metrics enabled',
    query: `
        CALL dbms.listConfig() 
        YIELD name, value 
        WHERE name='metrics.csv.enabled' 
        return value;
    `,
    columns: ['value'].map(column),
    exampleResult: [ { value: true } ],
});