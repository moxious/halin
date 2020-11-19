import HalinQuery from '../../HalinQuery';
import column from '../../column';

export default new HalinQuery({
    description: 'Lists active tasks the database',
    dependency: ctx => {
        const version = ctx.getVersion();
        return {
            pass: version.major >= 3 && version.minor >= 4,
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
        WITH 3.4 AS variant
        CALL dbms.listTransactions()
        
        YIELD transactionId, username, metaData, startTime, protocol,
        clientAddress, requestUri, currentQueryId, currentQuery, 
        activeLockCount, status, resourceInformation, elapsedTimeMillis,
        cpuTimeMillis, waitTimeMillis, idleTimeMillis
        
        /* Rename fields so we can tell when a duplicated field comes from TX data */
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
            idleTimeMillis: idleTimeMillis
        }) as transactions
        
        /* Grab queries -- omit parameters because of https://github.com/moxious/halin/issues/97 */
        CALL dbms.listQueries()
        YIELD queryId, username, metaData, query, /* parameters, */ planner, runtime, indexes,
        startTime, protocol, clientAddress, requestUri, status, resourceInformation, 
        activeLockCount, elapsedTimeMillis, cpuTimeMillis, waitTimeMillis, idleTimeMillis,
        allocatedBytes, pageHits, pageFaults
        
        /* Rename fields so we can tell when a duplicated field comes from Query data */
        WITH transactions, collect({
            id: queryId,
            query: query,
            /* parameters: parameters, */
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
            pageFaults: pageFaults
        }) as queries
        
        UNWIND transactions as transaction

        RETURN 
            transaction.id, 
            transaction,
            [q in queries WHERE q.id = transaction.currentQueryId][0] as query

        ORDER BY transaction.elapsedTimeMillis DESC
        LIMIT 500            
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
                // "parameters": {},
                "pageFaults": 0,
                "status": "running"
              },              
        },
    ],
});