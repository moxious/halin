import sinon from 'sinon';

import HalinContext from './HalinContext';
import ClusterManager from './cluster/ClusterManager';
import neo4j from './driver/index';
import fakes from '../testutils/fakes';

describe('Halin Context', function () {
    describe('Static Members', function () {
        it('can get connection details from the environment', () => {
            const details = HalinContext.getConnectionDetailsFromEnvironment();
            ['tlsLevel', 'username', 'password', 'host', 'port'].forEach(p => expect(details).toHaveProperty(p));
        });
    });

    let ctx;
    const driver = fakes.Driver();

    beforeEach(() => {
        HalinContext.connectionDetails = fakes.basics;
        ctx = new HalinContext();
        neo4j.driver = sinon.fake.returns(driver);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('can be constructed, and initializes certain properties', () => {
        expect(ctx).toBeTruthy();

        expect(typeof ctx.drivers).toEqual('object');
        expect(ctx.mgr).toBeTruthy();
    });

    it('has a members accessor', () => expect(ctx.members()).toEqual(ctx.clusterMembers));
    it('exposes a poll rate', () => expect(ctx.getPollRate()).toEqual(ctx.pollRate));
    it('exposes a cluster manager', () => expect(ctx.getClusterManager()).toBeInstanceOf(ClusterManager));
    it('can get a driver for an address', () => {
        const addr = 'bolt://foo-host:7777';
        const d = ctx.driverFor(addr, 'neo4j', 'password');
        expect(d).toBeTruthy();
        expect(ctx.drivers[addr]).toEqual(d);
        expect(neo4j.driver.called).toBeTruthy();
    });

    it('can initialize', () => {
        return ctx.initialize()
            .then(() => {
                expect(ctx.base.host).toEqual(fakes.basics.host);
                expect(ctx.base.username).toEqual(fakes.basics.username);
                expect(ctx.base.password).toEqual(fakes.basics.password);
            });
    });

    describe('Post Initialization', function () {
        beforeEach(() => ctx.initialize());

        it('knows it supports APOC from queryfakes', () => expect(ctx.supportsAPOC()).toEqual(true));
        it('knows it is enterprise', () => {
            expect(ctx.isEnterprise()).toEqual(true);
            expect(ctx.isCommunity()).toEqual(false);
        });
        it('knows it is a cluster because it has multiple members', () => 
            expect(ctx.isCluster()).toBe(true));
        it('knows that it supports native auth', () =>
            expect(ctx.supportsNativeAuth()).toBe(true));
        it('supports system graph', () =>
            expect(ctx.supportsSystemGraph()).toBe(true));
        it('can get its base URI', () =>
            expect(ctx.getBaseURI()).toEqual(`bolt://${fakes.basics.host}:${fakes.basics.port}`));
        it('knows its current user', () => {
            expect(ctx.getCurrentUser().username).toEqual('neo4j');
        });
    });
});