import HalinQuery from '../HalinQuery';
import column from '../column';

export default new HalinQuery({
    description: 'Lists active connections to the database',
    query: `
        CALL dbms.listConnections()
        YIELD connectionId, connectTime, connector, username, userAgent,
        serverAddress, clientAddress
        RETURN connectionId, connectTime, connector, username, userAgent,
        serverAddress, clientAddress
        ORDER BY connectTime ASC
    `,
    columns: ['connectionId', 'connectTime', 'connector', 
        'username', 'userAgent', 'serverAddress', 'clientAddress'].map(column),
    exampleResult: [ 
        {
            connectionId: 'bolt-180',
            connectTime: "2019-03-04T19:41:00.77Z",
            connector: 'bolt',
            username: 'neo4j',
            userAgent: "neo4j-javascript/1.7.2",
            serverAddress: "127.0.0.1:7687",
            clientAddress: "127.0.0.1:55321",
        },
    ],
});