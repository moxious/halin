import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches a list of graph schema constraints',
    dependency: null,
    query: `
        WITH 'generic' AS variant
        CALL db.constraints()
        YIELD description
        RETURN description
    `,
    columns: [
        { Header: 'Description', accessor: 'description' },
    ],
    exampleResult: [
        { description: "CONSTRAINT ON ( person:Person ) ASSERT exists(person.name)" },
        { description: "CONSTRAINT ON ( person:Person ) ASSERT person.id IS UNIQUE" },
    ],
});
