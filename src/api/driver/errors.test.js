import errors from './errors';

describe('Neo4j Driver Error Detection', function () {
    const errTypes = {
        unauthorized: 'unauthorized',
        permissionDenied: 'Permission denied',
        noProcedure: 'no procedure with the name foobar',
        failedToEstablishConnection: 'failed to establish connection in 150000ms',
        browserSecurityConstraints: 'security constraints in your web browser',
        noActiveDatabase: 'No active database',
        insecureWSFromHTTPS: 'insecure websocket connection may not be initiated from a page loaded over HTTPS',
        repeatedAuthFailure: 'incorrect authentication details too many times in a row',
        fileNotFound: 'java.io.FileNotFoundException',
        connectionRefused: 'ERR_CONNECTION_REFUSED',
        apocFileImportNotEnabled: 'set apoc.import.file.enabled=true',
        notUpToRequestedVersion: 'database not up to requested version',   
    };

    it('has a matches function that works', () => {
        const err = new Error('blork');

        expect(errors.matches('blork')(err)).toBe(true);
        expect(errors.matches('foo')(err)).toBe(false);
        expect(errors.matches('BLORK')(err)).toBe(true);
    });

    Object.keys(errTypes).map(key => {
        it(`Knows how to detect errors of type ${key}`, () => {
            const fn = errors[key];
            const sampleError = new Error(errTypes[key]);
            const bogusError = new Error('Completely irrelevant other message');

            expect(fn(sampleError)).toBe(true);
            expect(fn(bogusError)).toBe(false);
        });

        if (key.indexOf('apoc') < 0) {
            it(`Knows that error ${key} is a Neo4j Error`, () => {
                const sampleError = new Error(errTypes[key]);
                expect(errors.isNeo4jError(sampleError)).toBe(true);
            });
        } else {
            it(`Knows that ${key} is an APOC error`, () => {
                const sampleError = new Error(errTypes[key]);
                expect(errors.isAPOCError(sampleError)).toBe(true);
            });
        }
    });
});