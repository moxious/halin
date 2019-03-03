import HalinQuery from './HalinQuery';
import _ from 'lodash';

describe('HalinQuery', function () {
    const props = {
        query: 'RETURN 1 as value',
        columns: [
            { Header: 'value', accessor: 'value' },
        ],
    };

    it('can be constructed', () => {
        expect(new HalinQuery(props)).toBe.ok;
    });

    it('exposes a disclaimer', () => expect(typeof HalinQuery.disclaimer).toBe('string'));
    it('can disclaim queries', () => {
        const q = 'RETURN 1';

        expect(HalinQuery.disclaim(q)).toContain(HalinQuery.disclaimer);
    });

    it('requires a query', () => {
        const partial = _.pick(props, ['columns']);

        expect(() => new HalinQuery(partial)).toThrow(Error);
    });

    it('requires columns with accessors', () => {
        const partial = _.pick(props, ['query']);
        partial.columns = [ {
            Header: 'I have no accessor',
        }];

        expect(() => new HalinQuery(partial)).toThrow(Error);
    });
});
