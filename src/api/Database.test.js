import Database from './Database';

const makeRecord = (database, host, status, role='FOLLOWER', def) => ({
    name: database,
    address: host,
    role,
    requestedStatus: status,
    currentStatus: status,
    error: '',
    default: def,
})

const showDatabaseResults = [
    makeRecord('system', 'core1:7687', 'online', 'LEADER', false),
    makeRecord('system', 'core2:7687', 'online', 'FOLLOWER', false),
    makeRecord('system', 'core3:7687', 'online', 'FOLLOWER', false),
    makeRecord('mydb', 'core1:7687', 'online', 'FOLLOWER', true),
    makeRecord('mydb', 'core2:7687', 'online', 'LEADER', true),
    makeRecord('mydb', 'core3:7687', 'online', 'FOLLOWER', true),
];

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
});