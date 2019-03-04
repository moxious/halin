import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Determines which version of APOC the database has (if any)',
    query: `RETURN apoc.version() AS version`,
    columns: [
        { Header: 'Version', accessor: 'version' },
    ],
    exampleResults: [ { version: "3.5.0.2" } ],
});