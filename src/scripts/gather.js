import HalinContext from '../data/HalinContext';
import collection from '../diagnostic/collection/index';

const ctx = new HalinContext();

const gatherDiagnosticsAndQuit = halin => {
    return collection.runDiagnostics(halin)
        .then(data => {
            console.log(JSON.stringify(data));
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
    .then(ctx =>
        // It's useful to have some ticks and not gather immediately.
        // This lets us gather some ping stats and other response time
        // stats.
        setTimeout(() => gatherDiagnosticsAndQuit(ctx), 
            process.env.WAIT_TIME || 5000))
    .catch(err => {
        console.error('Fatal error',err);
        process.exit(1);
    });