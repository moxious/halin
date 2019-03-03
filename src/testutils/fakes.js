import sinon from 'sinon';

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

const ClusterNode = data => ({
    dbms: {},
    getLabel: sinon.fake.returns('FAKE_CLUSTER_NODE'),
    run: sinon.fake.returns(Promise.resolve(results(data))),
});

const FailingClusterNode = err => ({
    dbms: {},
    run: () => Promise.reject(new Error(err)),
});

const DataFeed = (returnData) => ({
    feedStartTime: new Date(),
    addListener: sinon.fake.returns(true),
    currentState: sinon.fake.returns({ time: new Date(), data: returnData }),
    min: sinon.fake.returns(13),
    max: sinon.fake.returns(31),
});

const HalinContext = (returnData) => ({
    getDataFeed: sinon.fake.returns(DataFeed(returnData)),
});

export default {
    results,
    record,
    ClusterNode,
    FailingClusterNode,
    HalinContext,
    DataFeed,
};