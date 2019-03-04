import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    query: `
        CALL dbms.procedures() 
        YIELD name 
        WHERE name =~ 'db.stats.clear'
        RETURN name
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
    ],
    exampleResults: [ { name: 'db.stats.clear' } ],
});