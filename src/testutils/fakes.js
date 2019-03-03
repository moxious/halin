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
    run: (query, params) => {
        return Promise.resolve(results(data));
    },
});

const FailingClusterNode = err => ({
    dbms: {},
    run: () => Promise.reject(new Error(err)),
});

export default {
    results,
    record,
    ClusterNode,
    FailingClusterNode,
};