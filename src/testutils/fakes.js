import sinon from 'sinon';
import Ring from 'ringjs';
import { TimeEvent, TimeRange } from 'pondjs';

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

const ClusterNode = data => {
    const host = `fakehost-${i++}`;
    return {
        dbms: {},
        getLabel: sinon.fake.returns(host),
        run: sinon.fake.returns(Promise.resolve(results(data))),
        getBoltAddress: sinon.fake.returns(`bolt://${host}:7777`),
    };
};

const FailingClusterNode = err => ({
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

const HalinContext = (returnData) => ({
    getDataFeed: sinon.fake.returns(DataFeed(returnData)),
    clusterNodes: [
        ClusterNode(returnData),
        ClusterNode(returnData),
    ],
});

export default {
    results,
    record,
    ClusterNode,
    FailingClusterNode,
    HalinContext,
    DataFeed,
};