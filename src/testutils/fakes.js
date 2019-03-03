import sinon from 'sinon';
import Ring from 'ringjs';
import { TimeEvent } from 'pondjs';
import moment from 'moment';

let i = 0;

const record = data => {
    return {
        get: (field) => {
            if (data[field]) { return data[field]; }
            throw new Error('Missing field in FakeRecord');
        },
    };
};

const results = results => ({
    records: results.map(record),
});

const ClusterMember = data => {
    const host = `fakehost-${i++}`;
    return {
        dbms: {},
        getLabel: sinon.fake.returns(host),
        run: sinon.fake.returns(Promise.resolve(results(data))),
        getBoltAddress: sinon.fake.returns(`bolt://${host}:7777`),
        getCypherSurface: sinon.fake.returns(Promise.resolve([
            { type: 'function', name: 'foobar', signature: 'foobar()', description: 'blah', roles: [] },
        ])),
    };
};

const FailingClusterMember = err => ({
    dbms: {},
    run: () => Promise.reject(new Error(err)),
});

const DataFeed = (returnData) => {
    const events = new Ring(5);
    const listeners = [];
    let state = {
        data: returnData[0],
        time: new Date(),
        events,
        event: new TimeEvent(new Date(), returnData[0]),
    };

    const df = {
        events,
        feedStartTime: new Date(),
        addListener: f => listeners.indexOf(f) === -1 ? listeners.push(f) : null,
        currentState: sinon.fake.returns(state),
        min: sinon.fake.returns(13),
        max: sinon.fake.returns(31),
        fakeEvent: () => {
            const event = new TimeEvent(new Date(), returnData[0]);
            // Simulate the datafeed doing something.
            events.push(event);
            state = {
                lastDataArrived: new Date(),
                time: new Date(),
                data: returnData,
                event,
                events,
            };
            // Alert listeners
            listeners.map(listener => listener(state, df));
        },
        addAliases: x => [x],
    };

    return df;
};

const ClusterManager = () => {
    return {
        getEventLog: sinon.fake.returns([
            {
                date: moment.utc(),
                type: 'foo',
                message: 'bar',
                machine: 'whatever'
            }
        ])
    };
};

const HalinContext = (returnData) => {
    const mgr = ClusterManager();
    const clusterMembers = [
        ClusterMember(returnData),
        ClusterMember(returnData),
    ];

    return {
        getDataFeed: sinon.fake.returns(DataFeed(returnData)),
        members: sinon.fake.returns(clusterMembers),
        getClusterManager: sinon.fake.returns(mgr),
    };
};

export default {
    results,
    record,
    ClusterMember,
    FailingClusterMember,
    HalinContext,
    DataFeed,
    ClusterManager,
};