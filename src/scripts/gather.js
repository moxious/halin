import HalinContext from '../data/HalinContext';
import collection from '../diagnostic/collection/index';
import sentry from '../sentry/index';

const ctx = new HalinContext();

const gatherDiagnosticsAndQuit = halin => {
    return collection.runDiagnostics(halin)
        .then(data => {
            // Regular console, **not** sentry because we want the data raw dumped.
            console.log(JSON.stringify(data));
            return halin.shutdown();
        })
        .then(() => process.exit(0))
        .catch(err => {
            sentry.error('Failed to gather diagnostics', err);
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
        sentry.error('Fatal error',err);
        process.exit(1);
    });