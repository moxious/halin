import HalinQuery from '../HalinQuery';
import neo4j from '../../../driver';
import column from '../column';

export default new HalinQuery({
    description: 'Fetches a list of active locks for a given query',
    query: `
        WITH 'generic' AS variant
        CALL dbms.listActiveLocks($queryId) 
        YIELD mode, queryId, resourceType, resourceId
        RETURN mode, queryId, resourceType, resourceId
    `,
    parameters: {
        queryId: 'the Query ID to check',
    },
    columns: ['mode', 'resourceType', 'resourceId'].map(column),
    exampleResult: [
        {
            mode: 'SHARED',
            queryId: 'query-67811',
            resourceId: neo4j.int(0),
            resourceType: 'LABEL',
        },
    ],
});