import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches an APOC metric by name, if supported',
    // Only supported with very recent versions of APOC
    dependency: {
        type: 'procedure',
        name: 'apoc.metrics.get',
    },
    query: `
        CALL apoc.metrics.get($metric)
        YIELD timestamp, value
        RETURN timestamp, value
        ORDER BY timestamp DESC LIMIT $last
    `,
    columns: [
        // { Header: 'Timestamp', accessor: 't' },
        { Header: 'Value', accessor: 'value' },
    ],
    parameters: { 
        last: 'Count of most recent items to fetch from the file',
        metric: 'Name of the metric to fetch'
    },
    exampleResult: [
        { timestamp: 1111, value: 0.0 },
    ],
});