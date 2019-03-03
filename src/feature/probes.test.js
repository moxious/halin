import probes from './probes';
import fakes from '../testutils/fakes';
import sentry from '../sentry/index';

sentry.disable();

describe('Feature Probes', function () {
    const name = 'some-name';
    const versions = ['3.5.0'];
    const edition = 'enterprise';

    const fakeData = [{ name, versions, edition }];
    const fakeNode = fakes.ClusterNode(fakeData);

    it('knows how to get name, versions, and edition', () => {
        return probes.getNameVersionsEdition(fakeNode)
            .then(output => {
                expect(output.name).toEqual(name);
                expect(output.versions).toEqual(versions);
                expect(output.edition).toEqual(edition);
            });
    });

    describe('APOC probe', () => {
        it('returns true if APOC is present', () =>
            probes.hasAPOC(fakes.ClusterNode([{ value: true }]))
                .then(result => expect(result).toEqual(true)));

        it('returns false if the function does not exist', () =>
            probes.hasAPOC(fakes.FailingClusterNode('Unknown function'))
                .then(result => expect(result).toEqual(false)));
    });

    describe('Auth Enabled Check', () => {
        it('returns the value of auth_enabled', () =>
            probes.authEnabled(fakes.ClusterNode([ { value: "true" }]))
                .then(result => expect(result).toEqual('true')));

        it('returns false when it sees permission denied', () =>
            probes.authEnabled(fakes.FailingClusterNode('Permission denied'))
                .then(result => expect(result).toEqual(false)));
    });

    describe('Native Auth Check', () => {
        it('returns true when type is native', () => 
            probes.supportsNativeAuth(fakes.ClusterNode([ { value: ['native'] }]))
                .then(r => expect(r).toEqual(true)));

        it('returns false when type is not native', () =>
            probes.supportsNativeAuth(fakes.ClusterNode([ { value: ['ldap'] }]))
                .then(r => expect(r).toEqual(false)));
    });

    describe('Listing Metrics', () => {
        const metrics = [ { name: 'a', lastUpdated: 'sss' } ];
        it('can get metrics', () =>
            probes.getAvailableMetrics(fakes.ClusterNode(metrics))
                .then(r => {
                    // console.log(r);
                    expect(r.length).toEqual(1);
                    expect(r[0]).toEqual(metrics[0]);
                }));
        
        it('returns an empty array on error', () =>
            probes.getAvailableMetrics(fakes.FailingClusterNode('no procedure'))
                .then(r => expect(r).toEqual([])));
    });
});