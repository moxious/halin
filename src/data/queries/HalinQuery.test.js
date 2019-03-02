import HalinQuery from './HalinQuery';

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
});
