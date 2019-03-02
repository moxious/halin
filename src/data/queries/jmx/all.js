import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    dependency: null,
    query: `
        CALL dbms.queryJmx('*:*') 
        YIELD name, description, attributes 
        RETURN name, description, attributes;
    `,
    columns: [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Description', accessor: 'description' },
        { Header: 'Attributes', accessor: 'attributes' },
    ],
});