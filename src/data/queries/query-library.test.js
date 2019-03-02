import ql from './query-library';
import HalinQuery from './HalinQuery';

describe('Query Library', function () {
    it('is an object', () => expect(ql).toBeInstanceOf(Object));

    Object.keys(ql).forEach(key => {
        it(`has key ${key} which is a HalinQuery`, () =>
            expect(ql[key]).toBeInstanceOf(HalinQuery));
    });
});