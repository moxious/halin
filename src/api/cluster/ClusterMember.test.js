import ClusterMember from './ClusterMember';
import fakes from '../../testutils/fakes';
import HalinContext from '../HalinContext';
import sinon from 'sinon';
import neo4j from '../driver/index';
import Ring from 'ringjs';
import _ from 'lodash';

describe('ClusterMember', function () {
    const host = 'foo-host';
    const boltAddress = `bolt://${host}:7777`;
    const httpAddress = `http://${host}:8888`;
    const entry = {
        id: 'XYZ',
        addresses: [httpAddress, boltAddress],
        groups: [],
        role: 'LEADER',
        database: 'ABC',
    };
    const fakeRecord = fakes.record(entry);
    let c;

    beforeEach(() => {
        c = new ClusterMember(fakeRecord);
        c.setDriver(fakes.Driver());
    });

    it('can be constructed', () => {
        expect(c.id).toEqual(entry.id);
        expect(c.addresses).toEqual(entry.addresses);
        expect(c.role).toEqual(entry.role);
        expect(c.database.neo4j).toEqual('LEADER');
    });

    it('can calculate its performance', () => {
        // Fake data for observations with a single record
        c.observations.push({ x: new Date(), y: 1 });
        c.observations.push({ x: new Date(), y: 1 });
        c.observations.push({ x: new Date(), y: 1 });

        const perf = c.performance();
        expect(perf).toBeTruthy();
        const props = [
            'stdev', 'mean', 'median', 'mode', 'min', 'max', 'observations',
        ];

        props.forEach(p => expect(perf).toHaveProperty(p));
    });

    it('can make a JSON representation of itself', () => {
        const j = c.asJSON();

        const keys = [
            'address', 'role', 'id', 'groups', 'label', 'dbms', 'performance',
            'pool', 'database',
        ];

        keys.forEach(k => expect(j).toHaveProperty(k));
    });

    it('can be constructed with a Neo4j 4.0 entry', () => {
        const m = new ClusterMember(fakes.record({
            id: 'XYZ',
            addresses: [httpAddress, boltAddress],
            groups: [],
            databases: {
                foo: ClusterMember.ROLE_LEADER,
                bar: ClusterMember.ROLE_FOLLOWER,
            },
        }));

        expect(m.getDatabaseRoles().foo).toEqual(ClusterMember.ROLE_LEADER);
    });

    it('exposes getObservations', () => {
        const obs = c.getObservations();
        expect(obs).toBeInstanceOf(Ring);
    });

    it('knows its bolt address', () => expect(c.getBoltAddress()).toEqual(boltAddress));
    it('knows how to label by host', () => expect(c.getLabel()).toEqual(host));
    it('knows how to extract protocols', () => {
        const prots = c.protocols();
        expect(prots).toContain('http');
        expect(prots).toContain('bolt');
    });

    it('knows its role', () => {
        expect(c.isLeader()).toEqual(true);
        expect(c.isFollower()).toEqual(false);
        expect(c.isReadReplica()).toEqual(false);
        expect(c.canWrite()).toEqual(true);
        expect(c.isCore()).toEqual(true);
    });

    it('keeps stats in observations', () => {
        c.setDriver(fakes.Driver());

        return Promise.all([
            c.run('RETURN true AS value'),
            c.run('RETURN true AS value'),
            c.run('RETURN true AS value'),
        ]).then(() => {
            // Observations is a RingJS ring
            expect(c.getObservations().toArray().length).toEqual(3);
            c.getObservations().toArray().forEach(obs => {
                expect(obs).toHaveProperty('x');
                expect(obs).toHaveProperty('y');
            });
        });
    });

    it('will not merge changes with a different member', () => {
        const different = _.cloneDeep(entry);
        different.id = 'I AM SOMETHING ELSE';
        const other = new ClusterMember(fakes.record(different));
        other.setDriver(fakes.Driver());

        expect(() => c.merge(different)).toThrow(Error);
    });

    it('can merge changes', () => {
        const different = _.cloneDeep(entry);
        different.address = 'I changed!';
        different.groups = ['foo'];
        const other = new ClusterMember(fakes.record(different));
        other.setDriver(fakes.Driver());

        c.merge(other);

        expect(c.addresses).toEqual(different.addresses);
        expect(c.groups).toEqual(different.groups);
    });

    it('can make a standalone entry, and attach a driver', () => {
        HalinContext.connectionDetails = fakes.basics;
        const ctx = new HalinContext();
        neo4j.driver = sinon.fake.returns(fakes.Driver());

        return ctx.initialize()
            .then(() => {
                const c = ClusterMember.makeStandalone(ctx, entry);
                expect(c).toBeTruthy();
                expect(c.driver).toBeTruthy();
                expect(c.pool).toBeTruthy();
                expect(c.standalone).toBeTruthy();
            });
    });

    describe('Feature Probes', function () {
        it('supportsAuth probe', () => expect(c.supportsAuth()).toBeFalsy());
        it('supportsDBStats probe', () => expect(c.supportsDBStats()).toBeFalsy());  
        it('csvMetricsEnabled probe', () => expect(c.csvMetricsEnabled()).toBeFalsy());
        it('supportsMultiDatabase probe', () => expect(c.supportsMultiDatabase()).toBeFalsy());
    });
});