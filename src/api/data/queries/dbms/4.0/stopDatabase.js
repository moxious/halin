import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Stops a database',
    query: `STOP DATABASE $name;`,
    parameters: {
        name: 'Name of the database',
    },
    columns: [
        // Produces no output
    ],
    exampleResult: [ 
    ],
});