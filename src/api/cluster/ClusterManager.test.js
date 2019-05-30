import ClusterManager from './ClusterManager';
import ClusterMember from './ClusterMember';
import HalinContext from '../HalinContext';
import fakes from '../../testutils/fakes';
import neo4j from '../driver/index';
import sinon from 'sinon';

let i = 0;
const fakeAMember = (role='FOLLOWER') => {
    const host = `test-host${i++}`;
    const boltAddress = `bolt://${host}:7777`;
    const httpAddress = `http://${host}:8888`;
    const entry = {
        id: i,
        addresses: [httpAddress, boltAddress],
        role,
        database: 'ABC',
    };
    const fakeRecord = fakes.record(entry);

    return new ClusterMember(fakeRecord);
};

describe('ClusterManager', function () {
    let ctx;
    let mgr;

    beforeEach(() => {
        ctx = new HalinContext();        
        neo4j.driver = sinon.fake.returns(fakes.Driver());
        return ctx.initialize()
            .then(() => {
                const fakeMembers = [
                    fakeAMember('LEADER'),
                    fakeAMember('FOLLOWER'),
                    fakeAMember('FOLLOWER'),
                ];

                // ctx.members = fakeMembers;
                mgr = new ClusterManager(ctx);
            });
    });

    afterEach(() => sinon.restore());

    it('can be constructed', () => {
        expect(mgr.eventLog).toBeTruthy();
        expect(mgr.getEventLog()).toEqual([]);
    });

    it('can add an event to the log', () => {
        const type = 'serious';
        const message = 'Something Happened!';
        console.log('MGR',mgr);
        mgr.addEvent({ message, type });

        const myThing = mgr.getEventLog().filter(i => i.type === type)[0];
        expect(myThing).toBeTruthy();
        expect(myThing.message).toEqual(message);
        expect(myThing.date).toBeTruthy();
        expect(myThing.id).toBeTruthy();
    });   
});