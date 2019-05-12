import probes from './probes';
import fakes from '../testutils/fakes';
import sentry from '../sentry/index';

sentry.disable();

describe('Feature Probes', function () {
    const fakeNode = fakes.ClusterMember();

    it('knows how to get name, versions, and edition', () => {
        return probes.getNameVersionsEdition(fakeNode)
            .then(output => {
                // Values taken from queryfakes
                expect(output.name).toEqual('some-name');
                expect(output.versions).toEqual(['3.5.0']);
                expect(output.edition).toEqual('enterprise');
            });
    });

    describe('APOC probe', () => {
        it('returns true if APOC is present', () =>
            probes.hasAPOC(fakes.ClusterMember([{ value: true }]))
                .then(result => expect(result).toEqual(true)));

        it('returns false if the function does not exist', () =>
            probes.hasAPOC(fakes.FailingClusterMember('Unknown function'))
                .then(result => expect(result).toEqual(false)));
    });

    describe('Auth Enabled Check', () => {
        it('returns the value of auth_enabled', () =>
            probes.authEnabled(fakes.ClusterMember([ { value: "true" }]))
                .then(result => expect(result).toEqual('true')));

        it('returns false when it sees permission denied', () =>
            probes.authEnabled(fakes.FailingClusterMember('Permission denied'))
                .then(result => expect(result).toEqual(false)));
    });

    describe('Native Auth Check', () => {
        it('returns true when type is native', () => 
            probes.supportsNativeAuth(fakes.ClusterMember([ { value: ['native'] }]))
                .then(r => expect(r).toEqual(true)));

        it('returns false when type is not native', () =>
            probes.supportsNativeAuth(fakes.ClusterMember([ { value: ['ldap'] }]))
                .then(r => expect(r).toEqual(false)));
    });

    describe('Listing Metrics', () => {
        // const metrics = [ { name: 'a', lastUpdated: 'sss' } ];
        it('can get metrics', () =>
            probes.getAvailableMetrics(fakes.ClusterMember())
                .then(r => {
                    // Values taken from queryfakes
                    expect(r.length).toEqual(1);
                    expect(r[0].lastUpdated).toEqual(1111111);
                    expect(r[0].name).toEqual('foometric');
                }));
        
        it('returns an empty array on error', () =>
            probes.getAvailableMetrics(fakes.FailingClusterMember('no procedure'))
                .then(r => expect(r).toEqual([])));
    });
});