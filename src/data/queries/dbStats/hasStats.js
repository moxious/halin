import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Determines whether or not the db.stats.* procedures are available to collect query statistics (generally only available in Neo4j >= 3.5.2)',
    dependency: ctx => {
        const v = ctx.getVersion();
        return {
            pass: v.major >= 3 && v.minor >= 5 && v.patch >= 2;
            description: 'Requires Neo4j >= 3.5.2',
        };
    },
    query: `
        CALL dbms.procedures() 
        YIELD name 
        WHERE name =~ 'db.stats.clear'
        RETURN name
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
    ],
    exampleResult: [ { name: 'db.stats.clear' } ],
});