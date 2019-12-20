import probes from './probes';
import fakes from '../../testutils/fakes';
import sentry from '../../api/sentry/index';

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
                .then(r => {
                    expect(r.nativeAuth).toEqual(true);
                    expect(r.systemGraph).toEqual(false);
                }));

        it('returns false when type is not native', () =>
            probes.supportsNativeAuth(fakes.ClusterMember([ { value: ['ldap'] }]))
                .then(r => {
                    expect(r.nativeAuth).toEqual(false);
                    expect(r.systemGraph).toEqual(false);
                }));

        it('knows that system-graph counts as native', () =>
            probes.supportsNativeAuth(fakes.ClusterMember([ { value: ['system-graph'] }]))
                .then(r => {
                    expect(r.nativeAuth).toEqual(true);
                    expect(r.systemGraph).toEqual(true);
                }));
    });

    describe('Fabric Probe', () => {
        const faker = config => ({
            getConfiguration: () => Promise.resolve(config),
        });

        it('knows when fabric config is missing', () => {
            const faked = faker({
                'fabric.database.name': 'foo',
            });

            return probes.usesFabric(faked)
                .then(fabric => {
                    // Because it's missing a fabric.graph.0.uri
                    expect(fabric).toBeFalsy();
                });
        });

        it('knows how to return a good fabric config', () => {
            const faked = faker({
                'fabric.database.name': 'foo',
                'fabric.graph.0.uri': 'neo4j://a',
                'fabric.graph.0.name': 'graphA',
                'fabric.graph.1.uri': 'neo4j://b',
                'fabric.graph.1.name': 'graphB',
            });

            return probes.usesFabric(faked)
                .then(fabric => {
                    expect(fabric).toBeTruthy();
                    expect(fabric.database).toEqual('foo');
                    expect(fabric.graphs.length).toEqual(2);
                    expect(fabric.graphs[0].name).toEqual('graphA');
                    expect(fabric.graphs[1].name).toEqual('graphB');
                });
        });
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