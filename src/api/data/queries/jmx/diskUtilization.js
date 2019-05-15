import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches statistics on overall disk utilization by the database',
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
                txLogs + arrayStore)) as otherStore,
            1024 * 1024 * 1024 as GB
        WITH [
            {
                label: "Counts",
                units: "GB",
                value: toFloat(countStore) / GB
            },
            {
                label: "Indexes",
                units: "GB",
                value: toFloat(indexStore) / GB                
            },
            {
                label: "Labels",
                units: "GB",
                value: toFloat(labelStore) / GB
            },
            {
                label: "Nodes",
                units: "GB",
                value: toFloat(nodeStore) / GB
            },
            {
                label: "Properties",
                units: "GB",
                value: toFloat(propStore) / GB
            },
            {
                label: "Relationships",
                units: "GB",
                value: toFloat(relStore) / GB
            },
            {
                label: "Schema",
                units: "GB",
                value: toFloat(schemaStore) / GB
            },
            {
                label: "Strings",
                units: "GB",
                value: toFloat(stringStore) / GB
            },
            {
                label: "Transaction Logs",
                units: "GB",
                value: toFloat(txLogs) / GB
            },
            {
                label: "Arrays",
                units: "GB",
                value: toFloat(arrayStore) / GB
            },
            {
                label: "Other",
                units: "GB",
                value: toFloat(otherStore) / GB
            }
        ] as observations
        UNWIND observations as observation
        RETURN 
            observation.label as label, 
            observation.units as units,
            observation.value as value;
    `,

    columns: [
        { Header: 'Label', accessor: 'value' },
    ],
    rate: 1000,
    exampleResult: [
        {
            label: 'Other',
            value: 1.14,
        },
    ],
});