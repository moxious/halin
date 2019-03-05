import HalinQuery from '../../HalinQuery';

export default new HalinQuery({
    description: 'Lists active tasks the database',
    dependency: ctx => {
        const version = ctx.getVersion():
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
        CALL dbms.listTransactions()
        
        YIELD transactionId, username, metaData, startTime, protocol,
        clientAddress, requestUri, currentQueryId, currentQuery, 
        activeLockCount, status, resourceInformation, elapsedTimeMillis,
        cpuTimeMillis, waitTimeMillis, idleTimeMillis, connectionId
        
        /* Rename fields so we can tell when a duplicated field comes from TX data */
        WITH 
            transactionId AS TXtransactionId, 
            username AS TXusername, 
            metaData AS TXmetaData, 
            startTime AS TXstartTime, 
            protocol AS TXprotocol,
            clientAddress AS TXclientAddress, 
            requestUri AS TXrequestUri, 
            currentQueryId AS TXcurrentQueryId, 
            currentQuery AS TXcurrentQuery, 
            activeLockCount AS TXactiveLockCount, 
            status AS TXstatus, 
            resourceInformation AS TXresourceInformation, 
            elapsedTimeMillis AS TXelapsedTimeMillis,
            cpuTimeMillis AS TXcpuTimeMillis, 
            waitTimeMillis AS TXwaitTimeMillis, 
            idleTimeMillis AS TXidleTimeMillis, 
            connectionId AS TXconnectionId
        
        /* Grab queries */
        CALL dbms.listQueries()
        YIELD queryId, username, metaData, query, parameters, planner, runtime, indexes,
        startTime, protocol, clientAddress, requestUri, status, resourceInformation, 
        activeLockCount, elapsedTimeMillis, cpuTimeMillis, waitTimeMillis, idleTimeMillis,
        allocatedBytes, pageHits, pageFaults, connectionId
        
        /* Rename fields so we can tell when a duplicated field comes from Query data */
        WITH 
            queryId AS QqueryId, 
            username AS Qusername, 
            metaData AS QmetaData, 
            query AS Qquery, 
            parameters AS Qparameters, 
            planner AS Qplanner, 
            runtime AS Qruntime, 
            indexes AS Qindexes,
            startTime AS QstartTime, 
            protocol AS Qprotocol, 
            clientAddress AS QclientAddress, 
            requestUri AS QrequestUri, 
            status AS Qstatus, 
            resourceInformation AS QresourceInformation, 
            activeLockCount AS QactiveLockCount, 
            elapsedTimeMillis AS QelapsedTimeMillis, 
            cpuTimeMillis AS QcpuTimeMillis, 
            waitTimeMillis AS QwaitTimeMillis, 
            idleTimeMillis AS QidleTimeMillis,
            allocatedBytes AS QallocatedBytes, 
            pageHits AS QpageHits, 
            pageFaults AS QpageFaults, 
            connectionId AS QconnectionId,
        
        /* Block of carry-over TX definitions */
        TXtransactionId, TXusername, TXmetaData, TXstartTime, TXprotocol,
        TXclientAddress, TXrequestUri, TXcurrentQueryId, TXcurrentQuery, 
        TXactiveLockCount, TXstatus, TXresourceInformation, TXelapsedTimeMillis,
        TXcpuTimeMillis, TXwaitTimeMillis, TXidleTimeMillis, TXconnectionId
        
        /* Join queries to transactions by the Query ID */
        WHERE TXcurrentQueryId = QqueryId
        
        /* Fetch connections */
        CALL dbms.listConnections()
        YIELD connectionId, connectTime, connector, username, userAgent,
        serverAddress, clientAddress
        
        /* Rename fields */
        WITH *, /* Copy over previous variables */
            connectionId AS CconnectionId,
            connectTime AS CconnectTime,
            connector AS Cconnector,
            username AS Cusername,
            userAgent AS CuserAgent,
            serverAddress AS CserverAddress,
            clientAddress AS CclientAddress
        
        /* Join connections to transactions */
        WHERE CconnectionId = TXconnectionId
        
        WITH *, 
            CconnectionId + ':' + TXtransactionId + ':' + QqueryId AS id,
        {
            id: CconnectionId,
            connectTime: CconnectTime,
            connector: Cconnector,
            username: Cusername,
            userAgent: CuserAgent,
            serverAddress: CserverAddress,
            clientAddress: CclientAddress
        } as connection, 
        {
            id: TXtransactionId,
            metaData: TXmetaData,
            startTime: TXstartTime,
            protocol: TXprotocol,
            clientAddress: TXclientAddress,
            requestUri: TXrequestUri,
            currentQueryId: TXcurrentQueryId,
            currentQuery: TXcurrentQuery,
            activeLockCount: TXactiveLockCount,
            status: TXstatus,
            resourceInformation: TXresourceInformation,
            elapsedTimeMillis: TXelapsedTimeMillis,
            cpuTimeMillis: TXcpuTimeMillis,
            waitTimeMillis: TXwaitTimeMillis,
            idleTimeMillis: TXidleTimeMillis,
            connectionId: TXconnectionId
        } as transaction, 
        {
            id: QqueryId,
            query: Qquery,
            parameters: Qparameters,
            planner: Qplanner,
            runtime: Qruntime,
            indexes: Qindexes,
            startTime: QstartTime,
            protocol: Qprotocol,
            clientAddress: QclientAddress,
            requestUri: QrequestUri,
            status: Qstatus,
            resourceInformation: QresourceInformation,
            activeLockCount: QactiveLockCount,
            elapsedTimeMillis: QelapsedTimeMillis,
            cpuTimeMillis: QcpuTimeMillis,
            waitTimeMillis: QwaitTimeMillis,
            idleTimeMillis: QidleTimeMillis,
            allocatedBytes: QallocatedBytes,
            pageHits: QpageHits,
            pageFaults: QpageFaults,
            connectionId: QconnectionId
        } as query
        
        RETURN id, connection, transaction, query;
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