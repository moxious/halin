import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Creates a database',
    query: `CREATE DATABASE $name`,
    bare: true,
    parameters: {
        name: 'Name of the database',
    },
    columns: [
        // Produces no output
    ],
    exampleResult: [ 
    ],
});