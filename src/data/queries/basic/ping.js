import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Runs a trivial query, used to measure round-trip latency',
    query: 'RETURN true AS value',
    columns: [ { Header: 'Value', accessor: 'value' } ],
    rate: 1000,
    exampleResult: [ { value: true } ],
});