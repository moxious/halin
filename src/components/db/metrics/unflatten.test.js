import unflatten from './unflatten';

describe('Unflatten', function() {
    it('returns objects with identity that do not need unflattening', () => {
        const test = { x: 1, y: 2 };
        expect(unflatten(test)).toEqual(test);
    });

    it('unflattens one level', () => {
        const test = { 'a.b': 'c' };
        const expected = { 
            a: {
                b: 'c',
            },
        };

        expect(unflatten(test)).toEqual(expected);
    });

    it('unflattens multiple elements, multiple levels', () => {
        const test = {
            'github.handle': 'moxious',
            'github.metric': 44,
            'foo.bar.baz.quux': {},
            'foo.bar.baz.someBoolean': true,
        };

        const expected = {
            github: {
                handle: 'moxious',
                metric: 44,
            },
            foo: {
                bar: {
                    baz: {
                        quux: {},
                        someBoolean: true,
                    },
                },
            },
        };

        expect(unflatten(test)).toEqual(expected);
    });

    it('Supports separators', () => {
        const test = {
            'a/b': 'c',
        };
        const expected = {
            a: {
                b: 'c',
            },
        };

        expect(unflatten(test, { separator: '/' })).toEqual(expected);
    });
});