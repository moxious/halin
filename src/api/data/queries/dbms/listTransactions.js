import HalinQuery from '../HalinQuery';
import fields from '../../fields';
import neo4j from '../../../driver';
const cdt = fields;

export default new HalinQuery({
    description: 'Fetches a list of running transactions on the database at this moment',
    query: `
        CALL dbms.listTransactions()
        YIELD transactionId, username, metaData, startTime, protocol,
        clientAddress, requestUri, currentQueryId, currentQuery, 
        activeLockCount, status, resourceInformation, elapsedTimeMillis,
        cpuTimeMillis, waitTimeMillis, idleTimeMillis, connectionId
        RETURN transactionId, username, metaData, startTime, protocol,
        clientAddress, requestUri, currentQueryId, currentQuery, 
        activeLockCount, status, resourceInformation, elapsedTimeMillis,
        cpuTimeMillis, waitTimeMillis, idleTimeMillis, connectionId
    `,
    columns: [
        { Header: 'ID', accessor: 'transactionId' },
        { Header: 'CID', accessor: 'connectionId' },
        { Header: 'User', accessor: 'username' },
        { Header: 'Metadata', accessor: 'metaData', show: false, Cell: cdt.jsonField },
        { Header: 'Start Time', accessor: 'startTime', show: false },
        { Header: 'Protocol', accessor: 'protocol', show: false },
        { Header: 'Client Addr', accessor: 'clientAddress', show: false },
        { Header: 'Request URI', accessor: 'requestUri', show: false },
        { Header: 'QueryId', accessor: 'currentQueryId', show: false },
        { Header: 'Query', accessor: 'currentQuery', style: { whiteSpace: 'unset', textAlign: 'left' } },
        { Header: 'Locks', accessor: 'activeLockCount', Cell: cdt.numField },
        { Header: 'Status', accessor: 'status' },
        { Header: 'Resource Info', accessor: 'resourceInformation', show: false, Cell: cdt.jsonField },
        { Header: 'Idle', accessor: 'idleTimeMillis', Cell: cdt.timeField, show: false },
        { Header: 'Wait', accessor: 'waitTimeMillis', Cell: cdt.timeField },
        { Header: 'CPU', accessor: 'cpuTimeMillis', Cell: cdt.timeField, show: false },
        { Header: 'Elapsed', accessor: 'elapsedTimeMillis', Cell: cdt.timeField },
    ],
    exampleResult: [
        {
            transactionId: "transaction-136",
            username: 'neo4j',
            metaData: {
                "type": "user-direct",
                "app": "neo4j-browser_v3.2.17"
            },
            startTime: "2019-03-04T12:35:40.692Z",
            protocol: 'bolt',
            clientAddress: '127.0.0.1:55535',
            requestUri: '127.0.0.1:7687',
            currentQueryId: 'query-131',
            currentQuery: 'call dbms.listTransactions()',
            activeLockCount: neo4j.int(0),
            status: 'running',
            resourceInformation: {},
            elapsedTimeMillis: neo4j.int(17),
            cpuTimeMillis: neo4j.int(0),
            waitTimeMillis: neo4j.int(0),
            idleTimeMillis: neo4j.int(17),
            connectionId: 'bolt-12',
        },
    ],
});