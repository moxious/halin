import _ from 'lodash';
import neo4j from '../api/driver/index';
import HalinQuery from '../api/data/queries/HalinQuery';

const queries = {
    'RETURN true AS value': [
        { value: true },
    ],
    'RETURN 1;': [
        { 1: 1 },
    ],
    'RETURN 1 as value': [ { value: 1 } ],
    'CALL dbms.showCurrentUser()': [
        { username: 'neo4j', roles: ['admin'], flags: null },
    ],
    'RETURN apoc.version()': [
        { value: 'yup' },
    ],
    'CALL apoc.metrics.list()': [
        { name: 'foometric', lastUpdated: 1111111 },
    ],
    'CALL dbms.listConfig.*dbms.security.auth_enabled': [
        { value: 'true' },
    ],
    'CALL dbms.listConfig.*dbms.security.auth_provider.*': [
        { value: ['native'] },
    ],
    'WHERE name=\'dbms.memory.heap.max_size\'': [
        { value: '1G' },
    ],
    'physTotal': [
        {
            fdOpen: neo4j.int(622),
            fdMax: neo4j.int(10240),
            physFree: neo4j.int(1044156416),
            physTotal: neo4j.int(17179869184),
            virtCommitted: neo4j.int(7469420544),
            swapFree: neo4j.int(759169024),
            swapTotal: neo4j.int(3221225472),
            osName: "Mac OS X",
            osVersion: "10.13.6",
            arch: "x86_64",
            processors: neo4j.int(8),
        },
    ],
    'CALL dbms.procedures.*apoc.log.stream': [ { n: neo4j.int(0) } ],
    'CALL dbms.components': [
        { name: 'some-name', versions: ['3.5.0'], edition: 'enterprise' },
    ],
    'CALL dbms.procedures.*db.stats.clear': [],
    'CALL dbms.listConfig.*metrics.csv.enabled': [
        { value: 'true' },
    ],
    'CALL dbms.cluster.overview': [
        {
            id: 'A', addresses: ['bolt://testhost-A:7777'], role: 'LEADER', groups: [], database: 'DB',
        },
        {
            id: 'B', addresses: ['bolt://testhost-B:7777'], role: 'FOLLOWER', groups: [], database: 'DB',
        },
        {
            id: 'C', addresses: ['bolt://testhost-C:7777'], role: 'FOLLOWER', groups: [], database: 'DB',
        }
    ],
    'call dbms.cluster.role()': [
        { role: 'LEADER' },
    ],
};

export default {
    ...queries,
    response: (query /* , params */) => {
        let queryText = query;
        if (query instanceof HalinQuery) {
            queryText = query.getQuery();
        }

        const input = queryText.toLowerCase().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
        let found = null;

        Object.keys(queries).forEach(q => {
            if(found) { return; }
            // const qLower = q.toLowerCase();
            const re = new RegExp(q, 'im');
            if (input.match(re)) {                
                found = queries[q];
            }
        });

        if (_.isNil(found)) {
            // console.log('NO FAKE AVAILBLE FOR ', query);
        }

        // console.log('Found fake results', input, '=>', found);
        return found;
    },
};