import HalinQuery from '../HalinQuery';
import fields from '../../fields';
const cdt = fields;

export default new HalinQuery({
    query: `call dbms.listTransactions()`,
    columns: [
        { Header: 'ID', accessor: 'transactionId' },
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
        { Header: 'Bytes', accessor: 'allocatedBytes', Cell: cdt.numField, show: false },
        { Header: 'Direct (b)', accessor: 'allocatedDirectBytes', Cell: cdt.numField, show: false },            
        { Header: 'PageHits', accessor: 'pageHits', Cell: cdt.numField },
        { Header: 'PageFaults', accessor: 'pageFaults', Cell: cdt.numField },
    ],
});