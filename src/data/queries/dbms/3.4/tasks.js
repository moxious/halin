import HalinQuery from '../../HalinQuery';
import column from '../../column';

export default new HalinQuery({
    description: 'Lists active tasks the database',
    dependency: ctx => {
        const version = ctx.getVersion():
        return version.major >= 3 && version.minor >= 4;
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
        cpuTimeMillis, waitTimeMillis, idleTimeMillis
        
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
            idleTimeMillis AS TXidleTimeMillis 
        
        /* Grab queries */
        CALL dbms.listQueries()
        YIELD queryId, username, metaData, query, parameters, planner, runtime, indexes,
        startTime, protocol, clientAddress, requestUri, status, resourceInformation, 
        activeLockCount, elapsedTimeMillis, cpuTimeMillis, waitTimeMillis, idleTimeMillis,
        allocatedBytes, pageHits, pageFaults
        
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
        
        /* Block of carry-over TX definitions */
        TXtransactionId, TXusername, TXmetaData, TXstartTime, TXprotocol,
        TXclientAddress, TXrequestUri, TXcurrentQueryId, TXcurrentQuery, 
        TXactiveLockCount, TXstatus, TXresourceInformation, TXelapsedTimeMillis,
        TXcpuTimeMillis, TXwaitTimeMillis, TXidleTimeMillis
        
        /* Join queries to transactions by the Query ID */
        WHERE TXcurrentQueryId = QqueryId
        
        WITH *, 
            TXtransactionId + ':' + QqueryId AS id,
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
            idleTimeMillis: TXidleTimeMillis
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
            pageFaults: QpageFaults
        } as query
        
        RETURN id, transaction, query;
    `,
    columns: ['id', 'transaction', 'query'].map(column),
    exampleResult: [ 
        {
            id: "bolt-17:transaction-33:query-33",
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