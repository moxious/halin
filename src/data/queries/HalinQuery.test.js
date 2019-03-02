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
});
