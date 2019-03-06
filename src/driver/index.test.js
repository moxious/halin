import driver from './index';

describe('Neo4j Driver Add-Ons', function () {
    const anInt = driver.int(25);
    const bigNumString = "9007199254740999";
    const bigNum = driver.int(bigNumString);

    describe('Neo4j Numbers', function () {
        it('can tell if something is a Neo4j int', () => {
            expect(driver.isNeo4jInt(anInt)).toEqual(true);
            expect(driver.isNeo4jInt(null)).toEqual(null);
            expect(driver.isNeo4jInt(25)).toEqual(false);
        });

        it('handles neo4j numbers', () => {
            expect(driver.handleNeo4jInt(anInt)).toEqual(25);
            expect(driver.handleNeo4jInt(bigNum)).toEqual(bigNumString);
        });
    });

    describe('Unpacking results', () => {
        const data = {
            a: 'a',
            b: 'b',
            c: [1, 2, 3],
        };

        const fakeRecord = {
            get: field => {
                if (!data[field]) throw new Error('no field');
                return data[field];
            },
        };

        const fakeResults = {
            records: [ fakeRecord ],
        };

        it('can unpack results with a schema', () => {
            const unpacked = driver.unpackResults(fakeResults, {
                required: ['a', 'b'],
                optional: ['c'],
            });

            expect(typeof unpacked).toBe('object');
            expect(unpacked.length).toEqual(1);
            const f = unpacked[0];
            expect(f.a).toEqual(data.a);
            expect(f.b).toEqual(data.b);
            expect(f.c).toEqual(data.c);
            expect(f.index).toEqual(0);
        });
    });
});