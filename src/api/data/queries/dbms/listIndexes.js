import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Lists database indexes',
    query: `
        WITH 'generic' AS variant    
        CALL db.indexes() 
        YIELD id, name, state, populationPercent, uniqueness, type, 
              entityType, labelsOrTypes, properties, provider
        RETURN id, name, state, populationPercent, uniqueness, type,
            entityType, labelsOrTypes, properties, provider
        ORDER BY name asc;
    `,
    columns: [
        { Header: 'ID', accessor: 'id' },
        { Header: 'Name', accessor: 'name', },
        { Header: 'State', accessor: 'state' },
        { Header: 'Population', accessor: 'populationPercent' },
        { Header: 'Uniqueness', accessor: 'uniqueness' },
        { Header: 'Type', accessor: 'type' },
        { Header: 'Entity', accessor: 'entityType' },
        { Header: 'Labels/Types', accessor: 'labelsOrTypes' },
        { Header: 'Properties', accessor: 'properties' },
        { Header: 'Provider', accessor: 'provider' },
    ],
    exampleResult: [
        {
            id: 1,
            name: 'index_70bffdb',
            state: 'ONLINE',
            populationPercent: 100.0,
            uniqueness: 'NONUNIQUE',
            type: 'BTREE',
            entityType: 'NODE',
            labelsOrTypes: ['Label'],
            properties: ['name'],
            provider: 'native-btree-1.0',
        },
    ],
});