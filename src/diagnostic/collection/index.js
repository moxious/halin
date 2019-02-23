/**
 * This module is responsible for collecting diagnostics from a HalinContext.
 * It exports a single function which returns a complete diagnostic package given a HalinContext object.
 */
import _ from 'lodash';
import uuid from 'uuid';
import moment from 'moment';
import appPkg from '../../../package.json';
import neo4j from '../../driver/index';
import sentry from '../../sentry/index.js';
import queryLibrary from '../../data/query-library';

/**
 * Convenience function.  Different versions of Neo4j (community/enterprise) have different response
 * types depending on the stored procedure.  To get around failures to access a certain field which
 * may not exist in a certain edition, this is used to replace them with nulls.
 * @param {Object} rec driver response record
 * @param {*} field name of field
 * @returns {Object} the value of the field or null if it does not exist.
 */
const getOrNull = (rec, field) => {
    try {
        return rec.get(field);
    } catch (e) { return null; }
};

/**
 * Take a diagnostic package and return a cleaned up version of the same, removing
 * sensitive data that shouldn't go out.
 * This function intentionally modifies its argument.
 */
const cleanup = pkg => {
    const deepReplace = (keyToClean, newVal, object, path) => {
        if (neo4j.isNeo4jInt(object)) {
            return neo4j.handleNeo4jInt(object);
        }

        let found = false;

        _.each(object, (val, key) => {
            if (key === keyToClean) {
                found = true;
            } else if (_.isArray(val)) {
                object[key] = val.map((v, i) => deepReplace(keyToClean, newVal, v, `${path}[${i}]`));
            } else if (neo4j.isNeo4jInt(val)) {
                object[key] = neo4j.handleNeo4jInt(val);
            } else if (_.isObject(val)) {
                object[key] = deepReplace(keyToClean, newVal, val, `${path}.${key}`);
            }
        });

        if (found) {
            const copy = _.cloneDeep(object);
            copy[keyToClean] = newVal;
            return copy;
        }

        return object;
    };

    return deepReplace('password', '********', _.cloneDeep(pkg), '');
};

/**
 * Used as a wrapper for some promise; it provides a generic catch block that traps/reports
 * the error by some name, and resolves some data.
 * @param {String} title some string to report if things go wrong.
 * @param {Promise} somePromise a promise which might fail
 * @param {Object} whatToResolve when the promise fails.
 * @returns {Promise} that is guaranteed to succeed, either with the promises's results,
 * or with whatToResolve if the underlying somePromise failed.
 */
const swallowAndReportError = (title, somePromise, whatToResolve = {}) => {
    return somePromise.catch(err => {
        sentry.reportError(err, title);
        return whatToResolve;
    });
};

/**
 * Run a promise producing function with a session which will be closed once complete.
 * @param {HalinContext} halin
 * @param {ClusterNode} clusterNode 
 * @param {Function} f a function which produces a promise.
 * @returns {Promise} which resolves to f's result
 */
const withSession = (halin, clusterNode, f) => {
    const s = halin.driverFor(clusterNode.getBoltAddress()).session();
    return f(s).finally(() => s.close);
};

/**
 * Gather a single data point from a simple query.
 * Example args: 'apoc', 'RETURN apoc.version() as value', 'version'
 * @param {HalinContext} halin 
 * @param {ClusterNode} node 
 * @param {String} domain 
 * @param {String} query a cypher query which produces the data point
 * @param {String} key the name of the key to return. 
 * @returns {Promise} which is guaranteed to resolve to an object with domain as a key,
 * and key as the key of a nested object.  
 * Example args: domain='apoc', query='RETURN apoc.version() as value', key='version'
 * you would get { apoc: { version: '3.5.2' } }
 */
const simpleGather = (halin, node, domain, query, key) =>
    withSession(halin, node, s =>
        s.run(query, {})
            .then(results => results.records.length === 0 ? null : results.records[0].get('value'))
            .catch(err => `${err}`) // stringify on purpose, don't need full stacktrace
            .then(value => {
                const obj = {};
                obj[domain] = {};
                obj[domain][key] = neo4j.handleNeo4jInt(value);
                return obj;
            }));

const gatherUsers = (halin, node) => {
    const defaultIfUnable = { users: [] };

    if (halin.supportsAuth() && halin.supportsNativeAuth()) {
        const promise = withSession(halin, node,
            s => s.run('CALL dbms.security.listUsers()', {})
                .then(results =>
                    results.records.map(rec => ({
                        username: rec.get('username'),
                        flags: rec.get('flags'),
                        roles: getOrNull(rec, 'roles'), // This field doesn't exist in community.
                    })))
                .then(allUsers => ({ users: allUsers })));

        return swallowAndReportError('Gather Users', promise, defaultIfUnable);
    }

    return Promise.resolve(defaultIfUnable);
};

const gatherRoles = (halin, node) => {
    const defaultIfUnable = { roles: [] };

    if (halin.isEnterprise() && halin.supportsAuth()) {
        const promise = withSession(halin, node,
            s => s.run('CALL dbms.security.listRoles()', {})
                .then(results =>
                    results.records.map(rec => ({
                        role: rec.get('role'),
                        users: rec.get('users'),
                    })))
                .then(allRoles => ({ roles: allRoles })));

        return swallowAndReportError('Gather Roles', promise, defaultIfUnable);
    }

    return Promise.resolve(defaultIfUnable);
};

const gatherJMX = (halin, node) => {
    const defaultIfUnable = { JMX: [] };

    const promise = withSession(halin, node, s =>
        s.run(queryLibrary.JMX_ALL.query, {})
            .then(results =>
                results.records.map(rec => ({
                    name: rec.get('name'),
                    attributes: rec.get('attributes'),
                })))
            .then(array => ({ JMX: cleanup(array) })));

    return swallowAndReportError('Gather JMX', promise, defaultIfUnable);
};

const gatherConstraints = (halin, node) => {
    const defaultIfUnable = { constraints: [] };

    const promise = withSession(halin, node, s =>
        s.run(queryLibrary.GET_CONSTRAINTS.query, {})
            .then(results =>
                results.records.map((rec, idx) => ({ idx, description: rec.get('description') })))
            .then(allConstraints => ({ constraints: allConstraints })));

    return swallowAndReportError('Gather Constraints', promise, defaultIfUnable);
};

const gatherIndexes = (halin, node) => {
    const defaultIfUnable = { indexes: [] };

    // Signature differs between 3.4 and 3.5, particularly
    // label field vs. tokenNames field.  getOrNull handles
    // both cases.  
    // **Do not use the queryLibrary version** because it can't handle
    // the different signatures.
    const promise = withSession(halin, node, s =>
        s.run('CALL db.indexes()', {})
            .then(results =>
                results.records.map((rec, idx) => ({
                    description: getOrNull(rec, 'description'),
                    label: getOrNull(rec, 'label'),
                    tokenNames: getOrNull(rec, 'tokenNames'),
                    properties: getOrNull(rec, 'properties'),
                    state: getOrNull(rec, 'state'),
                    type: getOrNull(rec, 'type'),
                    provider: getOrNull(rec, 'provider'),
                })))
            .then(allIndexes => ({ indexes: allIndexes })));

    return swallowAndReportError('Gather Indexes', promise, defaultIfUnable);
};

const gatherConfig = (halin, node) => {
    const defaultIfUnable = { configuration: {} };

    const promise = withSession(halin, node, s =>
        s.run('CALL dbms.listConfig()', {})
            .then(results => {
                const configMap = {};
                results.records.forEach(rec => {
                    const key = rec.get('name');
                    const value = rec.get('value');

                    // Configs can have duplicate keys!
                    // which sucks.  but we need to detect that.
                    // If a second value is found, push it on to an array.
                    if (configMap.hasOwnProperty(key)) {
                        const presentValue = configMap[key];
                        if (_.isArray(presentValue)) {
                            presentValue.push(value);
                        } else {
                            configMap[key] = [presentValue, value];
                        }
                    } else {
                        if (neo4j.isInt(value)) {
                            configMap[key] = neo4j.integer.inSafeRange(value) ? value.toNumber() : neo4j.integer.toString(value);
                        } else {
                            configMap[key] = value;
                        }
                    }
                });
                return configMap;
            })
            .then(allConfig => ({ configuration: allConfig })));

    return swallowAndReportError('Gather Configuration', promise, defaultIfUnable);
};

/**
 * @param clusterNode{ClusterNode} 
 * @return Promise{Object} of diagnostic information about that node.
 */
const nodeDiagnostics = (halin, clusterNode) => {
    const basics = {
        basics: clusterNode.asJSON(),
    };

    /* GATHER STEPS.
     * Each of these is a promise that is guaranteed not to fail because it's wrapped
     */
    const genJMX = gatherJMX(halin, clusterNode);
    const users = gatherUsers(halin, clusterNode);
    const roles = gatherRoles(halin, clusterNode);
    const genConfig = gatherConfig(halin, clusterNode);
    const constraints = gatherConstraints(halin, clusterNode);
    const indexes = gatherIndexes(halin, clusterNode);

    const otherPromises = [
        simpleGather(halin, clusterNode, 'apoc', 'RETURN apoc.version() as value', 'version'),
        simpleGather(halin, clusterNode, 'nodes', 'MATCH (n) RETURN count(n) as value', 'count'),
        simpleGather(halin, clusterNode, 'schema', 'call db.labels() yield label return collect(label) as value', 'labels'),
        simpleGather(halin, clusterNode, 'algo', 'RETURN algo.version() as value', 'version'),
    ];

    return Promise.all([
        users, roles, indexes, constraints, genJMX, genConfig, ...otherPromises])
        .then(arrayOfDiagnosticObjects =>
            _.merge(basics, ...arrayOfDiagnosticObjects));
};

/**
 * @param {HalinContext} the context running
 * @return Promise{Object} of halin diagnostics.
 */
const halinDiagnostics = halinContext => {
    const halin = {
        halin: {
            cluster: halinContext.isCluster(),
            enterprise: halinContext.isEnterprise(),
            nativeAuth: halinContext.supportsNativeAuth(),
            pollRate: halinContext.getPollRate(),
            user: halinContext.getCurrentUser(),
            debug: _.get(halinContext, 'debug') || false,
            eventLog: halinContext.getClusterManager().getEventLog(),
            drivers: Object.keys(halinContext.drivers).map(uri => ({
                node: uri,
                _config: _.get(halinContext.drivers[uri], '_config') || null,
            })),
            activeProject: cleanup(halinContext.project),
            activeGraph: cleanup(halinContext.graph),
            dataFeeds: _.values(halinContext.dataFeeds).map(df => df.stats()),
            ...appPkg,
        }
    };

    return Promise.resolve(halin);
};

/**
 * @return Promise{Object} of Neo4j Desktop API diagnostics.
 */
const neo4jDesktopDiagnostics = () => {
    let api = null;

    try {
        api = window.neo4jDesktopApi;
    } catch (e) {
        // ReferenceError on missing window.
        api = null;
    }

    if (!api) {
        return Promise.resolve({ neo4jDesktop: 'MISSING' });
    }

    return api.getContext()
        .then(context => ({
            neo4jDesktop: cleanup(_.cloneDeep(context)),
        }));
};

/**
 * Run all diagnostics available to halin
 * @return Promise{Object} a large, heavyweight diagnostic object suitable for
 * analysis or shipping to the user.
 */
const runDiagnostics = halinContext => {
    const allNodeDiags = Promise.all(
        halinContext.clusterNodes.map(clusterNode => nodeDiagnostics(halinContext, clusterNode))
    )
        .then(nodeDiagnostics => ({ nodes: nodeDiagnostics }));

    const root = Promise.resolve({
        id: uuid.v4(),
        generated: moment().utc().toISOString(),
    });

    const halinDiags = halinDiagnostics(halinContext);
    const neo4jDesktopDiags = neo4jDesktopDiagnostics(halinContext);

    // Each object resolves to a diagnostic object with 1 key, and sub properties.
    // All diagnostics are just a merge of those objects.
    return Promise.all([root, halinDiags, allNodeDiags, neo4jDesktopDiags])
        .then(arrayOfObjects => _.merge(...arrayOfObjects))
};

export default {
    runDiagnostics,
};