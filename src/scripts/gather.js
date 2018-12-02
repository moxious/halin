import HalinContext from '../data/HalinContext';
import yargs from 'yargs';

console.log(yargs.argv);
const ctx = new HalinContext();

const gatherDiagnosticsAndQuit = (halin) => {
    return halin.runDiagnostics()
        .then(data => {
            console.log(JSON.stringify(data, null, 2));
            return halin.shutdown();
        })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Failed to gather diagnostics');
            console.error(err);
            process.exit(1);
        });
};

ctx.initialize()
    .then(ctx => {
        if (!ctx.isEnterprise()) {
            console.log(JSON.stringify(ctx.clusterNodes[0].asJSON(), null, 2));
            console.error('Diagnostic packages can only be gathered for Neo4j Enterprise');
            process.exit(1);
        }
    })
    .then(ctx =>
        // It's useful to have some ticks and not gather immediately.
        // This lets us gather some ping stats and other response time
        // stats.
        setTimeout(() => gatherDiagnosticsAndQuit(ctx), 
            process.env.WAIT_TIME || 5000))
    .catch(err => {
        console.error('ZOMG',err);
    });