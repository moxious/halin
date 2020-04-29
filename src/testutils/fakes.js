import sinon from 'sinon';
import Ring from 'ringjs';
import { TimeEvent } from 'pondjs';
import moment from 'moment';
import uuid from 'uuid';
import _ from 'lodash';

import sentry from '../api/sentry/index';
import queryFakes from './queryfakes';

sentry.disable();

let i = 0;
const basics = {
    username: 'neo4j',
    password: 'secret',
    host: 'test-host',
    port: 7777,
    encrypted: true,
    name: 'testing-shim',
};

const record = (data = { value: 1 }) => {
    return {
        get: (field) => {
            if (field in data) { return data[field]; }
            throw new Error(`Missing field in FakeRecord caller expected ${field} in ${JSON.stringify(data)}`);
        },
        has: field => !_.isNil(_.get(data, field)),
        toObject: () => data,
    };
};

const results = (results = []) => ({
    records: results.map(record),
});

const fakeRun = (data) => (query, params) => {
    if (data && data.length > 0) { return Promise.resolve(results(data)); }

    let foundFake = queryFakes.response(query, params);
    if (!_.isNil(foundFake)) { 
        if (!_.isArray(foundFake)) {
            throw new Error('Invalid non-array fake', foundFake);
        }
        return Promise.resolve(results(foundFake));
    }
    return Promise.resolve(results(data));
};

const ClusterMember = (data = []) => {
    const host = `fakehost-${i++}`;
    return {
        dbms: {},
        getLabel: sinon.fake.returns(host),
        run: fakeRun(data),
        canWrite: () => true,
        isLeader: () => true,
        isReadReplica: () => false,
        supportsMultiDatabase: () => true,
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

const DataFeed = (returnData = []) => {
    const events = new Ring(5);
    const listeners = {'data':[], 'error':[]};
    let state = {
        data: returnData[0],
        time: new Date(),
        events,
        event: new TimeEvent(new Date(), returnData[0]),
    };

    const df = {
        events,
        feedStartTime: new Date(),
        on: (event, f) => listeners[event].indexOf(f) === -1 ? listeners[event].push(f) : null,
        addAugmentationFunction: f => f,
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
            listeners['data'].map(listener => listener(state, df));
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

const HalinContext = (returnData = []) => {
    const mgr = ClusterManager();
    const clusterMembers = [
        ClusterMember(returnData),
        ClusterMember(returnData),
    ];

    return {
        getDataFeed: sinon.fake.returns(DataFeed(returnData)),
        members: sinon.fake.returns(clusterMembers),
        getClusterManager: sinon.fake.returns(mgr),
        isEnterprise: () => sinon.fake.returns(true),
        isCommunity: () => sinon.fake.returns(false),
        supportsRoles: () => sinon.fake.returns(true),
        getCurrentUser: sinon.fake.returns({
            username: 'neo4j', roles: ['admin'],
        }),
        driverFor: () => Driver(),
        connectionDetails: basics,
    };
};

const Session = (data = []) => {
    return {
        id: uuid.v4(),
        run: fakeRun(data),
        close: sinon.fake.returns(true),
    };
};

const Driver = (data = []) => {
    return {
        id: uuid.v4(),
        session: sinon.fake.returns(Session(data)),
    };
};

export default {
    basics,
    results,
    record,
    Driver,
    Session,
    ClusterMember,
    FailingClusterMember,
    HalinContext,
    DataFeed,
    ClusterManager,
};