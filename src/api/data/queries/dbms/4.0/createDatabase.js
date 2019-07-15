import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Creates a database',
    query: `CREATE DATABASE $name;`,
    parameters: {
        name: 'Name of the database',
    },
    columns: [
        // Produces no output
    ],
    exampleResult: [ 
    ],
});