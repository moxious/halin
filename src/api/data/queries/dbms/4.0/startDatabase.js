import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Starts a database',
    query: `START DATABASE $name`,
    bare: true,
    void: true,
    parameters: {
        name: 'Name of the database',
    },
    columns: [
        // Produces no output
    ],
    exampleResult: [ 
    ],
});