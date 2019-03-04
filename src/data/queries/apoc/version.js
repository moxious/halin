import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    query: `RETURN apoc.version() AS version`,
    columns: [
        { Header: 'Version', accessor: 'version' },
    ],
    exampleResults: [ { version: "3.5.0.2" } ],
});