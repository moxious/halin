import neo4j from '../../driver/index';
import HalinContext from '../../HalinContext';
import sinon from 'sinon';
import score from './score';
import fakes from '../../../testutils/fakes';

describe('Health Scoring', function () {
    let ctx;

    beforeEach(() => {
        neo4j.driver = sinon.fake.returns(fakes.Driver());
        HalinContext.connectionDetails = fakes.basics;

        ctx = new HalinContext();
        return ctx.initialize();            
    });

    it('can call feed freshness', () => {
        ctx.members().forEach(m => {
            const obj = score.feedFreshness(ctx, m);
            
            const numerics = ['score', 'total', 'fresh', 'notFresh'];
            numerics.forEach(n => expect(typeof obj[n]).toEqual('number'));

            expect(obj.created).toBeTruthy();
        });
    })
});