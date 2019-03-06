import HalinQuery from '../HalinQuery';
import column from '../column';

export default new HalinQuery({
    description: 'Fetches all JMX observations tracked by the database',
    dependency: null,
    query: `
        CALL dbms.queryJmx('*:*') 
        YIELD name, description, attributes 
        RETURN name, description, attributes;
    `,
    columns: ['name', 'description', 'attributes'].map(column),
    exampleResult: [
        {
            name: "org.neo4j:instance=kernel#0,name=Kernel",
            description: "Information about the Neo4j kernel",
            attributes: {
                "ReadOnly": {
                    "description": "Whether this is a read only instance",
                    "value": false
                },
                "KernelVersion": {
                    "description": "The version of Neo4j",
                    "value": "neo4j-kernel, version: 3.5.2,7878bd2465405ceac0335894f82ec11e39d154c2"
                },
                "StoreId": {
                    "description": "An identifier that, together with store creation time, uniquely identifies this Neo4j graph store.",
                    "value": "d177cf88f9d76d85"
                },
                "KernelStartTime": {
                    "description": "The time from which this Neo4j instance was in operational mode.",
                    "value": 1551702440542
                },
                "DatabaseName": {
                    "description": "The name of the mounted database",
                    "value": "graph.db"
                },
                "MBeanQuery": {
                    "description": "An ObjectName that can be used as a query for getting all management beans for this Neo4j instance.",
                    "value": "org.neo4j:instance=kernel#0,name=*"
                },
                "StoreLogVersion": {
                    "description": "The current version of the Neo4j store logical log.",
                    "value": 0
                },
                "StoreCreationDate": {
                    "description": "The time when this Neo4j graph store was created.",
                    "value": 1550434566569
                }
            },
        },
    ],
});