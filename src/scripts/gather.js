import HalinContext from '../data/HalinContext';
import yargs from 'yargs';

console.log(yargs.argv);
const ctx = new HalinContext();

ctx.initialize()
    .then(ctx => {
        console.log('Good:',ctx);
    })
    .catch(err => {
        console.error('ZOMG',err);
    });