import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    query: `
        CALL dbms.listConfig() 
        YIELD name, value 
        WHERE name='metrics.csv.enabled' 
        return value;
    `,
    columns: [
        { Header: 'Value', accessor: 'value' },
    ],
    exampleResults: [ { value: true } ],
});