import DataFeed from './DataFeed';
import fakes from '../../testutils/fakes';
import Ring from 'ringjs';

describe('DataFeed', function () {
    const member = fakes.ClusterMember([
        { value: 1 },
    ]);
    let feed;
    let props = {
        node: member,
        query: 'RETURN {x} as value',
        params: { x: 1 },
        rate: 123,
        displayColumns: [
            { header: "Value", accessor: 'value' },
        ],
    };;

    describe('Prior to Run Start', function () {
        beforeEach(() => {
            feed = new DataFeed(props);
        });

        it('can get current state', () => {
            const state = feed.currentState();
            expect(state.lastDataArrived).toBeInstanceOf(Date);
            expect(state.events).toBeInstanceOf(Ring);
            expect(state.time).toBeInstanceOf(Date);
        });

        it('supports adding augmentation functions', () => {
            const fn = () => 1;

            feed.addAugmentationFunction(fn);
            expect(feed.augmentFns.indexOf(fn)).toBeGreaterThan(-1);
        });

        it('can add an alias', () => {
            const alias = { foo: 'bar' };
            feed.addAliases(alias);
            expect(feed.aliases.indexOf(alias)).toBeGreaterThan(-1);
        });

        it('prior to run start, it is not running', () => expect(feed.isRunning()).toBeFalsy());
    });

    describe('After starting', function() {
        beforeEach(() => {
            feed = new DataFeed(props);
            feed.start();
        });

        afterEach(() => {
            feed.stop();

            if (feed.timeout) {
                clearInterval(feed.timeout);
            }
        });

        it('After starting, it is started', () => expect(feed.isRunning()).toBeTruthy());
        it('can stop', () => {
            feed.stop();
            expect(this.feedStartTime).toBeFalsy();
        });

        it('can provide statistics', () => {
            const stats = feed.stats();

            const truthyKeys = [
                'name', 'label', 'address', 'query',
            ];

            truthyKeys.forEach(k => expect(stats[k]).toBeTruthy());
        });
    });
});