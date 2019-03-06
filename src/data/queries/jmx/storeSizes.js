import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver/index';

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
    exampleResult: [
        {
            countStore: neo4j.int(96),
            indexStore: neo4j.int(40960),
            labelStore: neo4j.int(16400),
            schemaStore: neo4j.int(8201),
            txLogs: neo4j.int(628),
            stringStore: neo4j.int(8201),
            arrayStore: neo4j.int(8201),
            relStore: neo4j.int(24610),
            propStore: neo4j.int(16409),
            total: neo4j.int(140474),
            nodeStore: neo4j.int(8210),
            otherStore: neo4j.int(8558),
        },
    ],
});