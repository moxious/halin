import sentry from '../sentry/index';
import neo4jErrors from '../driver/errors';
import queryLibrary from '../data/queries/query-library';
import neo4j from '../../api/driver';
import _ from 'lodash';
import Promise from 'bluebird';

/**
 * A feature probe is a bit of code that runs against a cluster node to determine whether or not
 * that node has a certain feature or not.
 * 
 * They all take a node as an argument and return true/false or a small piece of data.
 */

/**
 * @returns Object of { name, versions, edition } with basic information about what kind
 * of Neo4j this is (e.g. enterprise vs. community)
 */
const getNameVersionsEdition = member => {
    const componentsPromise = member.run(queryLibrary.DBMS_COMPONENTS)
        .then(results => {
            const rec = results.records[0];
            return {
                name: rec.get('name'),
                versions: rec.get('versions'),
                edition: rec.get('edition'),
            };
        })
        .catch(err => {
            sentry.reportError(err, 'Failed to get DBMS components; this can be because user is not admin');
            return {
                name: 'UNKNOWN',
                versions: [],
                edition: 'UNKNOWN',
            };
        });
    return componentsPromise;
};

/**
 * File streaming (useful for logs and metrics) is an enabled feature if you have a
 * particular APOC function.
 */
const hasLogStreaming = member => {
    const prom = member.run(queryLibrary.APOC_LOG_STREAM, {})
        .then(results => results.records[0].get('n').toNumber() > 0)
        .catch(err => {
            sentry.reportError('Failed to probe for file streaming procedures', err);
            return false;
        });
    return prom;
};

const hasMultiDatabase = member => {
    const probePromise = member.run(queryLibrary.DBMS_4_SHOW_DATABASES, {}, neo4j.SYSTEM_DB)
        .then(results => true)
        .catch(err => {
            const str = `${err}`;
            if (str.indexOf('Invalid input')) {
                // This is what Neo4j does when it has no idea what you're talking 
                // about because you're issuing a >= 4.0 query to < 4.0.
                return false;
            }
            
            sentry.warn('Feature probe for multi-database returned unexpected error', false);
            return false;
        });
    return probePromise;
};

const hasDBStats = member => {
    // #operability
    // The full feature set needed for Halin was first introduced 
    // Neo4j 3.5.0 doesn't have any of the needed procedures.
    // Neo4j 3.5.1 has some, but is missing db.stats.clear
    // Neo4j 3.5.2 introduced db.stats.clear and actually works.
    const probePromise = member.run(queryLibrary.DB_QUERY_HAS_STATS)
        .then(results => results.records.length > 0)
        .catch(err => {
            sentry.reportError('DBStats probe failed', err);
            return false;
        });
    return probePromise;
};

/**
 * @returns true if APOC is present, false otherwise.
 */
const hasAPOC = member => {
    const apocProbePromise = member.run(queryLibrary.APOC_VERSION)
        .then(() => true)
        .catch(err => {
            const str = `${err}`;

            // Either way APOC isn't present, but only log the error if it's exotic.
            // If it errors with unknown function, that's how you know APOC isn't installed.
            if (str.indexOf('Unknown function') === -1) {
                sentry.reportError('APOC probe failed', err);
            }
            return false;
        });
    return apocProbePromise;
};

/**
 * @returns true if CSV metric reporting is enabled, false otherwise.
 */
const csvMetricsEnabled = member => {
    const csvMetricsProbePromise = member.run(queryLibrary.METRICS_CSV_ENABLED)
        .then(results => {
            const row = results.records[0];
            if (row && row.get('value') === 'true') {
                return true;
            } else {
                sentry.fine('CSV metrics not enabled', row);
            }
        })
        .catch(err => {
            if (neo4jErrors.permissionDenied(err)) {
                return false;
            }

            sentry.fine('Error on CSV metrics enabled probe', err);
            return false;
        });

    return csvMetricsProbePromise;
};

/**
 * @returns true if auth is enabled, false otherwise.
 */
const authEnabled = member => {
    const authEnabledPromise = member.run(queryLibrary.DBMS_AUTH_ENABLED)
        .then(results => {
            let authEnabled = true;
            results.records.forEach(rec => {
                const val = rec.get('value');
                authEnabled = `${val}`;
            });
            return authEnabled;
        })
        .catch(err => {
            if (neo4jErrors.permissionDenied(err)) {
                return false;
            }

            sentry.reportError(err, 'Failed to check auth enabled status');
            return true;
        });

    return authEnabledPromise;
};

/**
 * @returns { nativeAuth: true/false, systemGraph: true/false } 
 */
const supportsNativeAuth = member => {
    // See issue #27 for what's going on here.  DB must support native auth
    // in order for us to expose some features, such as user management.
    const authPromise = member.run(queryLibrary.DBMS_GET_AUTH_PROVIDER)
        .then(results => {
            let nativeAuth = false;
            let systemGraph = false;

            results.records.forEach(rec => {
                const val = rec.get('value');
                const valAsStr = `${val}`; // Coerce ['foo','bar']=>'foo,bar' if present

                if (valAsStr.indexOf('native') > -1) {
                    nativeAuth = true;
                    systemGraph = false;
                } else if(valAsStr.indexOf('system-graph') > -1) {
                    nativeAuth = true;
                    systemGraph = true;
                }
            });

            return { nativeAuth, systemGraph };
        })
        .catch(err => {
            if (neo4jErrors.permissionDenied(err)) {
                // Read only user can't do this, so we can't tell whether native
                // auth is supported.  So disable functionality which requires this.
                return false;
            }

            sentry.reportError(err, 'Failed to get DBMS auth implementation type');
            return false;
        });

    return authPromise;
};

/**
 * Probe for whether or not fabric is supported.
 * @param {ClusterMember} member 
 * @returns {Object} which is either null if fabric isn't supported, or { database, graphs: [] }
 */
const usesFabric = member => {
    return member.getConfiguration()
        .then(map => {
            // In order for us to consider this as having fabric, it has to be named and have at least
            // one graph URI configured, otherwise it couldn't possibly work.
            const fabricDB = _.get(map, 'fabric.database.name');
            const firstURI = _.get(map, 'fabric.graph.0.uri');

            if (!fabricDB || !firstURI) {
                return false;
            } else {
                let graphId = 0;
                const graphs = [];

                while(true) {
                    const prefix = `fabric.graph.${graphId}`;

                    // Get keys starting with the prefix pertaining to this fabric graph.
                    const keys = Object.keys(map).filter(key => key.indexOf(prefix) === 0);
                    if (keys.length === 0) {
                        break;
                    }

                    // Based on how fabric config works, these will end up looking like:
                    // { uri: 'bolt://whatever', database: 'foo', name: 'fabricFoo' }
                    const graph = {};
                    keys.forEach(k => {
                        const graphSpecificKey = k.replace(`${prefix}.`, '');
                        const value = _.get(map, k);
                        graph[graphSpecificKey] = value;
                    });

                    graphs.push(graph);
                    graphId++;
                }

                return {
                    database: fabricDB,
                    graphs,
                };
            }
        })
};

/**
 * @returns Array of { name, lastUpdated } metrics supported by the server.
 */
const getAvailableMetrics = member => {
    const prom = member.run(queryLibrary.LIST_METRICS.query, {})
        .then(results =>
            results.records.map(r => ({
                name: r.get('name'),
                lastUpdated: r.get('lastUpdated'),
            })))
        .catch(err => {
            const str = `${err}`;
            if (str.indexOf('no procedure') > -1 && str.indexOf('apoc.metrics.list') > -1) {
                // This is an ignoreable error that just means the user has an older APOC installed.
                // They may have metrics enabled but we can't get to them, so we'll say there are none.
                return [];
            }

            sentry.reportError('Failed to list metrics', err);
            return [];
        });
    
    return prom;
};

/**
 * Run all feature probes in the catalog for a cluster member and return an object that contains keys/values
 * about supported features.
 * @param {ClusterMember} member 
 * @returns {Promise} that resolves to a single object
 */
const runAllProbes = member => {
    let dbms = {};

    const allProbes = [
        () => getNameVersionsEdition(member)
            .then(result => { dbms = _.merge(_.cloneDeep(dbms), result); }),
        () => supportsNativeAuth(member)
            .then(result => {
                dbms.nativeAuth = result.nativeAuth;
                dbms.systemGraph = result.systemGraph;
            }),
        () => usesFabric(member).then(fabric => {
            dbms.fabric = fabric;
        }),    
        () => authEnabled(member)
            .then(result => { dbms.authEnabled = result; }),
        () => csvMetricsEnabled(member)
            .then(result => { dbms.csvMetricsEnabled = result; }),
        () => hasAPOC(member)
            .then(result => { dbms.apoc = result; }),
        () => hasLogStreaming(member)
            .then(result => { dbms.logStreaming = result; }),
        () => getAvailableMetrics(member)
            .then(metrics => { member.metrics = metrics; }),
        () => hasDBStats(member)
            .then(result => { dbms.hasDBStats = result }),
        () => hasMultiDatabase(member)
            .then(result => { dbms.multidatabase = result }),
        () => member.getConfiguration().then(() => {
            dbms.maxHeap = member.getConfigurationValue('dbms.memory.heap.max_size');
        }),
        () => member.getMaxPhysicalMemory().then(maxPhysMemory => {
            dbms.physicalMemory = maxPhysMemory;
        }),
    ];

    // When halin is first starting, doing all of these things in parallel can a bit
    // spam the server with new connections, so we limit concurrency which is friendlier
    // and also results in faster startup times.
    return Promise.map(allProbes, f => f(), { concurrency: 2 })
        .then(() => {
            if (member.isCommunity()) {
                // #operability As a special exception, community will fail 
                // the test to determine if a node supports native auth -- but it
                // does.  It fails because community doesn't have the concept of
                // auth providers.
                dbms.nativeAuth = true;
            }

            if (dbms.multidatabase) {
                dbms.systemGraph = true;
            }

            // { major, minor, patch }
            _.set(dbms, 'version', member.getVersion());
        })
        .then(() => dbms);
};

export default {
    runAllProbes,
    getNameVersionsEdition, 
    hasLogStreaming,
    hasMultiDatabase, 
    hasDBStats,
    hasAPOC,
    csvMetricsEnabled,
    authEnabled,
    supportsNativeAuth, 
    getAvailableMetrics, 
};
