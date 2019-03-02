import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    query: 'RETURN true AS value',
    columns: [ { Header: 'Value', accessor: 'value' } ],
    rate: 1000,
});