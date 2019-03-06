import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Provides an overview of cluster topology',
    dependency: ctx => ({
        pass: ctx.isCluster(),
        description: 'Requires clustered configuration',
    }),
    query: `
        CALL dbms.cluster.overview()
        YIELD id, addresses, role, groups, database
        RETURN id, addresses, role, groups, database    
    `,
    columns: [
        { Header: 'Role', accessor: 'role' },
    ],
    exampleResult: [ 
        {
            id: "414afeff-ddb5-4d34-b6b9-ae400e57a7f3",
            addresses: ["bolt://node1.cluster.graph.center:7687", "http://node1.cluster.graph.center:7474", "https://node1.cluster.graph.center:7473"],
            role: "FOLLOWER",
            groups: [],
            database: "default",
        },
        {
            id: "d93a0d8d-d9f6-4c86-9bbf-8f05b20abd24",
            addresses: ["bolt://node2.cluster.graph.center:7687", "http://node2.cluster.graph.center:7474", "https://node2.cluster.graph.center:7473"],
            role: "FOLLOWER",
            groups: [],
            database: "default",
        },
        {
            id: "ef1ba51b-f929-46f4-a910-9e7525bddb09",
            addresses: ["bolt://node3.cluster.graph.center:7687", "http://node3.cluster.graph.center:7474", "https://node3.cluster.graph.center:7473"],
            role: "LEADER",
            groups: [],
            database: "default",
        },
    ],
    rate: 5000,
});