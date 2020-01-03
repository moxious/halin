import queryfakes from '../testutils/queryfakes';
import Database from './Database';
import neo4j from './driver';
import HalinContext from './HalinContext';
import fakes from '../testutils/fakes';
import sinon from 'sinon';

const copySet = a => {
    const newSet = [];
    a.forEach(m => newSet.push(m));
    return newSet;
};

const fakeDB = name => new Database([
    queryfakes.makeDBRecord(name, 'testhostA:7777', 'online', 'FOLLOWER', false),
    queryfakes.makeDBRecord(name, 'testhostB:7777', 'online', 'FOLLOWER', false),
    queryfakes.makeDBRecord(name, 'testhostC:7777', 'online', 'LEADER', false),
]);

describe('DatabaseSet', function () {
    let set = null;
    let ctx = null;

    beforeEach(() => {
        HalinContext.connectionDetails = fakes.basics;
        ctx = new HalinContext();
        neo4j.driver = sinon.fake.returns(fakes.Driver());
        return ctx.initialize()
            .then(() => {
                set = ctx.getDatabaseSet();
            });
    });

    it('can be constructed', () => {
        expect(set).toBeTruthy();

        // Dummy databases from queryfakes
        expect(set.databases().length).toEqual(2);
    });

    it('can detect an added database by change merging', () => {
        const newSet = copySet(set.databases());

        const howMany = set.databases().length;
        
        // Add a new one.
        newSet.push(fakeDB('blah'));

        return set._mergeChanges(ctx, newSet)
            .then(() => {
                expect(set.databases().length).toEqual(howMany + 1);
                expect(set.getDatabaseByName('blah')).toBeTruthy();
            });
    });

    it('can shutdown', () => {
        expect(set.shutdown()).toBeTruthy();
    });

    it('can get a database by name', () => {
        const db = set.getDatabaseByName('system');
        expect(db).toBeTruthy();
        expect(db.getLabel()).toEqual('system');
    });

    it('can get a default database', () => {
        const db = set.getDefaultDatabase();
        expect(db).toBeTruthy();
        expect(db.getLabel()).toEqual('mydb');
    });

    it('can detect a removed database by change merging', () => {
        const newSet = copySet(set.databases());
        const removed = newSet.pop();
        const howMany = set.databases().length;

        return set._mergeChanges(ctx, newSet)
            .then(() => {
                expect(set.databases().length).toEqual(howMany - 1);
                expect(set.getDatabaseByName(removed.getLabel())).toBeFalsy();
            });
    });
});