import Database from './Database';
import HalinContext from './HalinContext';
import fakes from './../testutils/fakes';
import neo4j from './driver/index';
import sinon from 'sinon';
import queryFakes from './../testutils/queryfakes';

const showDatabaseResults = queryFakes['SHOW DATABASES'];  

describe('Database', function() {
    let dbs;
    let system;
    let mydb;

    beforeEach(() => {
        dbs = Database.fromArrayOfResults(showDatabaseResults);
        
        system = dbs.filter(d => d.name === 'system')[0];
        mydb = dbs.filter(d => d.name === 'mydb')[0];

        // throw new Error(JSON.stringify(dbs.map(d => d.asJSON()), null, 2));
    });

    it('creates results correctly', () => {
        expect(dbs.length).toEqual(2);

        expect(system).toBeTruthy();
        expect(mydb).toBeTruthy();
    });

    it('has a label that matches name', () => {
        expect(system.getLabel()).toEqual('system');
        expect(mydb.getLabel()).toEqual('mydb');
    });

    it('knows how to detect errors', () => {
        mydb.backingStatuses[2].error = 'Something went wrong!';

        expect(mydb.hasError()).toBeTruthy();
        expect(system.hasError()).toBeFalsy();
    });

    it('can return member statuses', () => {
        const s = system.getMemberStatuses();
        expect(s instanceof Array).toBeTruthy();
        expect(s.length).toEqual(3);
    });

    it('Knows about unique and differing statuses', () => {
        system.backingStatuses[1].currentStatus = 'b0rked';

        const statuses = system.getStatuses();

        expect(statuses.indexOf('b0rked') > -1).toBeTruthy();
        expect(statuses.indexOf('online') > -1).toBeTruthy();
    });

    it('can return singular status', () => {
        expect(mydb.getStatus()).toEqual('online');
    });

    it('knows if it is online', () => {
        expect(mydb.isOnline()).toBeTruthy();

        mydb.backingStatuses[1].currentStatus = 'b0rked';
        expect(mydb.isOnline()).toBeFalsy();
    });

    it('knows if it is reconciling', () => {
        // Current status is online but requested to be stopped.
        mydb.backingStatuses[1].requestedStatus = 'stopped';
        expect(mydb.isReconciling()).toBeTruthy();
    });

    it('knows if it has an error', () => {
        const err = 'something went wrong';
        mydb.backingStatuses[2].error = err;
        expect(mydb.hasError()).toBeTruthy();
    });

    it('can create a pre-Neo4j 4.0 dummy database', () => {
        const d = Database.pre4DummyDatabase();
        expect(d).toBeTruthy();
        expect(d.name).toEqual(Database.SINGLEDB_NAME);
        expect(d.isOnline()).toBeTruthy();
        expect(d.isDefault()).toBeTruthy();
    });

    it('knows if it is default', () => {
        expect(mydb.isDefault()).toBeTruthy();
        expect(system.isDefault()).toBeFalsy();
    });

    it('can make JSON of itself', () => {
        const obj = system.asJSON();
        expect(obj).toBeTruthy();
        expect(obj.name).toEqual('system');
    });

    it('requires an array of results to construct', () => {
        expect(() => new Database('foo')).toThrow(Error);
    });

    it('will not create a database with mismatched records', () => {
        expect(() => new Database([
            queryFakes.makeDBRecord('system', 'core1:7687', 'online', 'LEADER', false),
            queryFakes.makeDBRecord('otherdb', 'core1:7687', 'online', 'LEADER', true),
        ])).toThrow(Error);
    });  

    it('will not create a database with missing information', () => {
        expect(() => new Database([
            {
                name: 'system',
                currentStatus: 'online',
            },
        ])).toThrow(Error);
    });

    it('can merge with another', () => {
        const duplicateSet = Database.fromArrayOfResults(showDatabaseResults);
        const dupMydb = duplicateSet.filter(d => d.name === 'mydb')[0];
        
        // A replica just joined!
        dupMydb.backingStatuses.push({
            name: 'mydb',
            address: 'whatever',
            role: 'READ_REPLICA',
            requestedStatus: 'online',
            currentStatus: 'online',
            error: '',
            default: true,
        });

        const changed = mydb.merge(dupMydb);
        expect(changed).toBeTruthy();
        const found = mydb.backingStatuses.filter(s => s.role === 'READ_REPLICA')[0];
        expect(found).toBeTruthy();
    });

    it('will not merge with a different database', () =>
        expect(() => system.merge(mydb)).toThrow(Error));

    describe('ClusterMember awareness / mapping', function() {
        let ctx;

        beforeEach(() => {
            neo4j.driver = sinon.fake.returns(fakes.Driver());
            HalinContext.connectionDetails = fakes.basics;

            dbs = Database.fromArrayOfResults(showDatabaseResults);
        
            system = dbs.filter(d => d.name === 'system')[0];
            mydb = dbs.filter(d => d.name === 'mydb')[0];   

            ctx = new HalinContext();
            return ctx.initialize();            
        });

        it('will get members by role', () => {
            const members = system.getMembersByRole(ctx);
    
            expect(members.LEADER instanceof Array).toBeTruthy();
            expect(members.FOLLOWER instanceof Array).toBeTruthy();
            
            expect(members.LEADER[0]).toBeTruthy();
            expect(members.FOLLOWER.length).toEqual(2);
        });   

        it('can get the leader for a database', () => {
            const leader = system.getLeader(ctx);
            expect(leader).toBeTruthy();
            // See queryfakes responses to SHOW DATABASES
            expect(leader.getBoltAddress()).toContain('testhostA:7777');

            const otherLeader = mydb.getLeader(ctx);
            expect(otherLeader).toBeTruthy();
            expect(otherLeader.getBoltAddress()).toContain('testhostB:7777');
        });
    });
});