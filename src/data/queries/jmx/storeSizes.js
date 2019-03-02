import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    // otherStore is a calculated value that catches all other files which may
    // be in the store directory which don't belong to Neo4j.
    query: `            
        CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Store sizes') 
        YIELD attributes 
        WITH
            attributes.CountStoreSize.value as countStore,
            attributes.IndexStoreSize.value as indexStore,
            attributes.LabelStoreSize.value as labelStore,
            attributes.NodeStoreSize.value as nodeStore,
            attributes.PropertyStoreSize.value as propStore, 
            attributes.RelationshipStoreSize.value as relStore, 
            attributes.SchemaStoreSize.value as schemaStore,
            attributes.StringStoreSize.value as stringStore, 
            attributes.TotalStoreSize.value as total, 
            attributes.TransactionLogsSize.value as txLogs,                 
            attributes.ArrayStoreSize.value as arrayStore
        WITH countStore, indexStore, labelStore, nodeStore, 
            propStore, relStore, schemaStore, stringStore, total,
            txLogs, arrayStore, 
            (total - (countStore + indexStore + labelStore + nodeStore + 
                propStore + relStore + schemaStore + stringStore + 
                txLogs + arrayStore)) as otherStore
        RETURN 
            countStore, indexStore, labelStore,
            schemaStore, txLogs,
            stringStore, arrayStore, 
            relStore, propStore, total, nodeStore,
            otherStore;        
    `,

    columns: [
        { Header: 'Total Disk', accessor: 'total' },
        { Header: 'Nodes', accessor: 'nodeStore' },
        { Header: 'Rels', accessor: 'relStore' },
        { Header: 'Props', accessor: 'propStore' },
        { Header: 'Index', accessor: 'indexStore' },
        { Header: 'Schema', accessor: 'schemaStore' },
        { Header: 'TXs', accessor: 'txLogs' },
        { Header: 'Strings', accessor: 'stringStore' },
        { Header: 'Arrays', accessor: 'arrayStore' },
        { Header: 'Other', accessor: 'otherStore' },
    ],
    rate: 1000,
});