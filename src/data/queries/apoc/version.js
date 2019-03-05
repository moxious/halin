import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Determines which version of APOC the database has (if any)',
    dependency: ctx => ({
        pass: ctx.supportsAPOC(),
        description: 'Requires APOC (any version)',
    }),
    query: `RETURN apoc.version() AS version`,
    columns: [
        { Header: 'Version', accessor: 'version' },
    ],
    exampleResult: [ { version: "3.5.0.2" } ],
});