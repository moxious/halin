import HalinQuery from '../HalinQuery';
import column from '../column';

export default new HalinQuery({
    description: 'Fetches an APOC metric by name, if supported',
    dependency: ctx => ({
        pass: ctx.supportsMetrics(),
        description: 'Requires CSV Metrics Support (present in recent APOC releases)',
    }),
    query: `
        WITH 'generic' AS variant
        CALL apoc.metrics.get($metric)
        YIELD timestamp, metric, map
        RETURN timestamp, metric, map
        ORDER BY timestamp DESC LIMIT $last
    `,
    columns: ['timestamp', 'metric', 'map'].map(column),
    parameters: { 
        last: 'Count of most recent items to fetch from the file',
        metric: 'Name of the metric to fetch'
    },
    exampleResult: [
        { 
            timestamp: 1111, 
            map: {
                count: "406022",
            },
            metric: "neo4j.bolt.accumulated_processing_time",
        }, 
    ],
});