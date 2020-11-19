import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Lists active tasks the database',
    dependency: ctx => {
        const version = ctx.getVersion();
        return {
            pass: version.major >= 3 && version.minor >= 5,
            description: 'Requires Neo4j >= 3.4',
        };
    },
    /**
     * This query calls 3 key procedures in Neo4j, 
     * gets transaction, connection, and query information and 
     * joins their information, and packs the results
     * into a more compact single record structure.
     * 
     * The result is one record per thing happening on the server,
     * with full visibility into the details of that thing.
     */
    query: `
        WITH 3.5 as variant
        CALL dbms.listTransactions()
            
        YIELD transactionId, username, metaData, startTime, protocol,
        clientAddress, requestUri, currentQueryId, currentQuery, 
        activeLockCount, status, resourceInformation, elapsedTimeMillis,
        cpuTimeMillis, waitTimeMillis, idleTimeMillis, connectionId
        
        WITH collect({
            id: transactionId,
            metaData: metaData,
            startTime: startTime,
            protocol: protocol,
            clientAddress: clientAddress,
            requestUri: requestUri,
            currentQueryId: currentQueryId,
            currentQuery: currentQuery,
            activeLockCount: activeLockCount,
            status: status,
            resourceInformation: resourceInformation,
            elapsedTimeMillis: elapsedTimeMillis,
            cpuTimeMillis: cpuTimeMillis,
            waitTimeMillis: waitTimeMillis,
            idleTimeMillis: idleTimeMillis,
            connectionId: connectionId
        }) as transactions
        
        /* Grab queries */
        CALL dbms.listQueries()
        YIELD queryId, username, metaData, query, parameters, planner, runtime, indexes,
        startTime, protocol, clientAddress, requestUri, status, resourceInformation, 
        activeLockCount, elapsedTimeMillis, cpuTimeMillis, waitTimeMillis, idleTimeMillis,
        allocatedBytes, pageHits, pageFaults, connectionId
        
        WITH transactions, collect({
            id: queryId,
            query: query,
            parameters: parameters,
            planner: planner,
            runtime: runtime,
            indexes: indexes,
            startTime: startTime,
            protocol: protocol,
            clientAddress: clientAddress,
            requestUri: requestUri,
            status: status,
            resourceInformation: resourceInformation,
            activeLockCount: activeLockCount,
            elapsedTimeMillis: elapsedTimeMillis,
            cpuTimeMillis: cpuTimeMillis,
            waitTimeMillis: waitTimeMillis,
            idleTimeMillis: idleTimeMillis,
            allocatedBytes: allocatedBytes,
            pageHits: pageHits,
            pageFaults: pageFaults,
            connectionId: connectionId
        }) as queries
    
        /* Fetch connections */
        CALL dbms.listConnections()
        YIELD connectionId, connectTime, connector, username, userAgent,
        serverAddress, clientAddress
        
        /* Rename fields */
        WITH transactions, queries, collect({
            connectionId: connectionId,
            connectTime: connectTime,
            connector: connector,
            username: username,
            userAgent: userAgent,
            serverAddress: serverAddress,
            clientAddress: clientAddress
        }) as connections

        UNWIND transactions AS transaction
        RETURN 
            transaction,
            [q IN queries WHERE q.id = transaction.currentQueryId][0] as query,
            [c IN connections WHERE c.connectionId = transaction.connectionId][0] as connection

        ORDER BY transaction.elapsedTimeMillis DESC
        LIMIT 500
    `,
    columns: [
        { Header: 'ID', accessor: 'id' },
        { 
            Header: 'Connection', 
            accessor: 'connection',
            Cell: e => `${e.value}`,
        },
        { 
            Header: 'Transaction', 
            accessor: 'transaction',
            Cell: e => `${e.value}`,
        },
        { 
            Header: 'Query', 
            accessor: 'query',
            Cell: e => `${e.value}`,
        },
    ],
    exampleResult: [ 
        {
            id: "bolt-17:transaction-33:query-33",
            connection: {
                "connector": "bolt",
                "connectTime": "2019-03-05T20:43:22.428Z",
                "serverAddress": "127.0.0.1:7687",
                "userAgent": "neo4j-javascript/1.7.2",
                "id": "bolt-17",
                "clientAddress": "127.0.0.1:64239",
                "username": "neo4j"
              },
              transaction: {
                "activeLockCount": 0,
                "currentQueryId": "query-33",
                "currentQuery": "RETURN 1;",
                "requestUri": "127.0.0.1:7687",
                "clientAddress": "127.0.0.1:64239",
                "elapsedTimeMillis": 0,
                "metaData": {
                  "type": "user-direct",
                  "app": "neo4j-browser_v3.2.17"
                },
                "protocol": "bolt",
                "cpuTimeMillis": 0,
                "waitTimeMillis": 0,
                "idleTimeMillis": 0,
                "resourceInformation": {},
                "connectionId": "bolt-17",
                "startTime": "2019-03-05T20:43:30.246Z",
                "id": "transaction-33",
                "status": "Running"
              },
              query: {
                "activeLockCount": 0,
                "query": "RETURN 1",
                "runtime": "slotted",
                "requestUri": "127.0.0.1:7687",
                "clientAddress": "127.0.0.1:64239",
                "elapsedTimeMillis": 1,
                "protocol": "bolt",
                "cpuTimeMillis": null,
                "waitTimeMillis": 0,
                "indexes": [],
                "idleTimeMillis": null,
                "resourceInformation": {},
                "allocatedBytes": null,
                "connectionId": "bolt-17",
                "startTime": "2019-03-05T20:43:30.246Z",
                "pageHits": 0,
                "id": "query-33",
                "planner": "idp",
                "parameters": {},
                "pageFaults": 0,
                "status": "running"
              },              
        },
    ],
});