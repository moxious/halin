import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    dependency: null,
    query: `
        CALL db.constraints()
        YIELD description
        RETURN description
    `,
    columns: [
        { Header: 'Description', accessor: 'description' },
    ],
});
