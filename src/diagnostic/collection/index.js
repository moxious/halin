/**
 * This module is responsible for collecting diagnostics from a HalinContext.
 * It exports a single function which returns a complete diagnostic package given a HalinContext object.
 */
import _ from 'lodash';
import uuid from 'uuid';
import moment from 'moment';
import appPkg from '../../../package.json';
import neo4j from '../../driver/index';

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
    // Admittedly a bit nasty, this code detects whether what we're looking at is really a neo4j driver
    // int object, which is a special object designed to overcome the range differences between Neo4j numbers
    // and what JS can support.
    const isNeo4jInt = o =>
        o && _.isObject(o) && !_.isNil(o.high) && !_.isNil(o.low) && _.keys(o).length === 2;

    const deepReplace = (keyToClean, newVal, object, path) => {
        let found = false;

        _.each(object, (val, key) => {
            if (key === keyToClean) {
                found = true;
            } else if (_.isArray(val)) {
                object[key] = val.map((v, i)=> deepReplace(keyToClean, newVal, v, `${path}[${i}]`));
            } else if (isNeo4jInt(val)) {
                object[key] = neo4j.integer.inSafeRange(val) ? val.toNumber() : neo4j.integer.toString(val);
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
 * @param clusterNode{ClusterNode} 
 * @return Promise{Object} of diagnostic information about that node.
 */
const nodeDiagnostics = (halin, clusterNode) => {
    const basics = {
        basics: clusterNode.asJSON(),
    };

    const session = halin.driverFor(clusterNode.getBoltAddress()).session();

    // Query must return 'value'
    const noFailCheck = (domain, query, key) =>
        session.run(query, {})
            .then(results => results.records[0].get('value'))
            .catch(err => err)  // Convert errors into the value.
            .then(value => {
                const obj = {};
                obj[domain] = {};
                obj[domain][key] = value;
                return obj;
            });

    // Format all JMX data into records.
    // Put the whole thing into an object keyed on jmx.
    const genJMX = session.run("CALL dbms.queryJmx('*:*')", {})
        .then(results =>
            results.records.map(rec => ({
                name: rec.get('name'),
                attributes: rec.get('attributes'),
            })))
        .then(array => ({ JMX: cleanup(array) }))

    const users = session.run('CALL dbms.security.listUsers()', {})
        .then(results =>
            results.records.map(rec => ({
                username: rec.get('username'),
                flags: rec.get('flags'),
                roles: getOrNull(rec, 'roles'), // This field doesn't exist in community.
            })))
        .then(allUsers => ({ users: allUsers }));

    // This op is enterprise only.
    const roles = halin.isEnterprise() ? session.run('CALL dbms.security.listRoles()', {})
        .then(results =>
            results.records.map(rec => ({
                role: rec.get('role'),
                users: rec.get('users'),
            })))
        .then(allRoles => ({ roles: allRoles })) : Promise.resolve({});

    // Format node config into records.
    const genConfig = session.run('CALL dbms.listConfig()', {})
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
        .then(allConfig => ({ configuration: allConfig }));

    const constraints = session.run('CALL db.constraints()', {})
        .then(results =>
            results.records.map((rec, idx) => ({ idx, description: rec.get('description') })))
        .then(allConstraints => ({ constraints: allConstraints }));

    // Signature differs between 3.4 and 3.5, particularly
    // label field vs. tokenNames field.  getOrNull handles
    // both cases.
    const indexes = session.run('CALL db.indexes()', {})
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
        .then(allIndexes => ({ indexes: allIndexes }));

    const otherPromises = [
        noFailCheck('apoc', 'RETURN apoc.version() as value', 'version'),
        noFailCheck('nodes', 'MATCH (n) RETURN count(n) as value', 'count'),
        noFailCheck('schema', 'call db.labels() yield label return collect(label) as value', 'labels'),
        noFailCheck('algo', 'RETURN algo.version() as value', 'version'),
    ];

    return Promise.all([
        users, roles, indexes, constraints, genJMX, genConfig, ...otherPromises])
        .then(arrayOfDiagnosticObjects =>
            _.merge(basics, ...arrayOfDiagnosticObjects))
        .finally(() => session.close());
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