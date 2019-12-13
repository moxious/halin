import diff from './index';

describe('Configuration Diff', function () {
    const setOfSets = {
        member1: {
            A: 'foo',
            B: 'bar',
            C: 'blizz',
        },
       member2: {
           A: 'foo',
           B: 'bar',
           C: 'something else',
           D: 'absent from member1',
       },
    };

    const findEntry = (name, entries) => entries.filter(e => e.name === name)[0];

    it('can create a diff', () => {
        const r = diff.configurationDiff(setOfSets);
        
        const table = r.table;

        const a = findEntry('A', table);
        const b = findEntry('B', table);
        const c = findEntry('C', table);
        const d = findEntry('D', table);

        expect(a).toBeTruthy();
        expect(b).toBeTruthy();
        expect(c).toBeTruthy();
        expect(d).toBeTruthy();

        expect(a.unanimous).toBeTruthy();
        expect(a.member1).toEqual('foo');
        expect(a.member2).toEqual('foo');
        
        expect(b.unanimous).toBeTruthy();
        expect(c.unanimous).toBeFalsy();
        
        expect(d.member1).toEqual('<Value not specified>');
    });
});