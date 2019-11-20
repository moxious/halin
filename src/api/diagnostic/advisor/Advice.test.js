import Advice from './Advice';

describe('Advice', function () {

    const testAdviceParts = (expected, actual) => {
        expect(actual.addr).toEqual(expected.addr);
        expect(actual.finding).toEqual(expected.finding);
        expect(actual.advice).toEqual(expected.advice);
    };

    describe('Basics', function() {
        it('can make advice', () => {
            const data = {
                level: Advice.PASS,
                addr: 'foo',
                finding: 'whatever',
                advice: 'meh',
                evidence: 'blah',
            };

            const a = new Advice(data);

            expect(a.level).toEqual(Advice.PASS);
            testAdviceParts(data, a);
        });

        const testData = {
            addr: 'foo',
            finding: 'meh',
            advice: 'blah',
        };

        const adviceTypes = {
            info: Advice.INFO,
            warn: Advice.WARN,
            error: Advice.ERROR,
            pass: Advice.PASS,
        };

        Object.keys(adviceTypes).forEach(level => {
            it(`can make a ${level}`, () => {
                const staticMethod = Advice[level];
                const a = staticMethod(testData);
                expect(a.level).toEqual(adviceTypes[level]);
                testAdviceParts(testData, a);
            });
        });

        it('requires basic parameters', () => {
            expect(() => new Advice({})).toThrowError; // nonsense
            expect(() => new Advice({ level: Advice.PASS, addr: 'foo' })).toThrowError; // no finding
            expect(() => new Advice({ addr: 'foo', advice: 'bar' })).toThrowError; // No level.
        });

        it('errors require advice', () => {
            expect(() => Advice.error({ finding: 'blah' })).toThrowError;
        });

        it('warnings require advice', () => {
            expect(() => Advice.warn({ finding: 'blizz' })).toThrowError;
        })
    });
});