import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Drops a database',
    query: `DROP DATABASE $name;`,
    parameters: {
        name: 'Name of the database',
    },
    columns: [
        // Produces no output
    ],
    exampleResult: [ 
    ],
});