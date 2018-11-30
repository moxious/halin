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
        .then(() => process.exit(0));
};

ctx.initialize()
    .then(ctx => {
        console.log('Good:',ctx);

        setTimeout(() => gatherDiagnosticsAndQuit(ctx), 
            process.env.WAIT_TIME || 5000);
    })
    .catch(err => {
        console.error('ZOMG',err);
    });