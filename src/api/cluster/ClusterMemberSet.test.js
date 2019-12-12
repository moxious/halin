import ClusterMember from './ClusterMember';
import ClusterMemberSet from './ClusterMemberSet';
import HalinContext from '../HalinContext';
import fakes from '../../testutils/fakes';
import neo4j from '../driver/index';
import sinon from 'sinon';
import queryfakes from '../../testutils/queryfakes';

const copySet = a => {
    const newSet = [];
    a.forEach(m => newSet.push(m));
    return newSet;
};

describe('ClusterMemberSet', function () {
    let ctx;
    let memberSet;

    beforeEach(() => {
        memberSet = new ClusterMemberSet();
        HalinContext.connectionDetails = fakes.basics;
        ctx = new HalinContext();
        neo4j.driver = sinon.fake.returns(fakes.Driver());

        return memberSet.initialize(ctx, fakes.Driver());
    });

    afterEach(() => sinon.restore());

    it('can be constructed and initialized correctly', () => {
        expect(memberSet).toBeTruthy();

        // These are the IDs of cluster members that our fake construct made
        const ids = queryfakes['CALL dbms.cluster.overview'].map(rec => rec.id);

        expect(memberSet.members().length).toEqual(ids.length);

        // We found all of our expected IDs.
        memberSet.members().forEach(m => {
            expect(ids.indexOf(m.id) > -1).toBeTruthy();
        });
    });

    it('calls member shutdown functions when the set is shut down', () => {
        memberSet.clusterMembers.forEach(m => {
            m.shutdown = sinon.fake.returns(Promise.resolve(true));
        });

        return memberSet.shutdown()
            .then(() => {
                memberSet.clusterMembers.forEach(m => {
                    expect(m.shutdown.callCount).toEqual(1);
                });
            });
    });

    it('has a members accessor that returns clusterMembers', () => {
        const arr = memberSet.members();
        expect(arr instanceof Array).toBeTruthy();

        arr.forEach(member => {
            expect(member instanceof ClusterMember).toBeTruthy();
        });
    });

    it('can remove a member', () => {
        const newSet = copySet(memberSet.members());
        const removed = newSet.pop();
        const howMany = memberSet.members().length;

        return memberSet._mergeChanges(ctx, newSet)
            .then(() => {
                expect(memberSet.members().length).toEqual(howMany - 1);
                expect(memberSet.members().filter(m => m.getId() === removed.getId())[0]).toBeFalsy();
            });
    });
});