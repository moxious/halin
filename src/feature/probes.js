import sentry from '../sentry/index';
import neo4jErrors from '../driver/errors';
import queryLibrary from '../data/query-library';

/**
 * A feature probe is a bit of code that runs against a cluster node to determine whether or not
 * that node has a certain feature or not.
 * 
 * They all take a node as an argument and return true/false or a small piece of data.
 */
export default {
    /**
     * @returns Object of { name, versions, edition } with basic information about what kind
     * of Neo4j this is (e.g. enterprise vs. community)
     */
    getNameVersionsEdition: node => {
        const componentsPromise = node.run('CALL dbms.components()', {})
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
    },

    /**
     * File streaming (useful for logs and metrics) is an enabled feature if you have a
     * particular APOC function.
     */
    hasLogStreaming: node => {
        const prom = node.run(`
            CALL dbms.procedures() 
            YIELD name 
            WHERE name="apoc.log.stream" 
            RETURN count(name) as n
        `, {})
            .then(results => results.records[0].get('n').toNumber() > 0)
            .catch(err => {
                sentry.reportError('Failed to probe for file streaming procedures', err);
                return false;
            });
        return prom;
    },

    /**
     * @returns true if APOC is present, false otherwise.
     */
    hasAPOC: node => {
        const apocProbePromise = node.run('RETURN apoc.version()', {})
            .then(results => {
                return true;
            })
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
    },

    /**
     * @returns true if CSV metric reporting is enabled, false otherwise.
     */
    csvMetricsEnabled: node => {
        const csvMetricsProbePromise = node.run(`
            CALL dbms.listConfig() 
            YIELD name, value 
            WHERE name='metrics.csv.enabled' 
            return value;`, {})
            .then(results => {
                const row = results.records[0];
                if (row && row.get('value') === 'true') {
                    return true;
                } else {
                    sentry.fine('CSV metrics not enabled', row);
                }
            })
            .catch(err => {
                sentry.fine('Error on CSV metrics enabled probe', err);
                return false;
            });

        return csvMetricsProbePromise;
    },

    /**
     * @returns true if auth is enabled, false otherwise.
     */
    authEnabled: node => {
        const authEnabledQ = `
            CALL dbms.listConfig() YIELD name, value
            WHERE name =~ 'dbms.security.auth_enabled'
            RETURN value;
        `;
        const authEnabledPromise = node.run(authEnabledQ, {})
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
                    this.dbms.authEnabled = false;
                    return false;
                }

                sentry.reportError(err, 'Failed to check auth enabled status');
                return true;
            });

        return authEnabledPromise;
    },

    /**
     * @returns true if the server supports native auth, false otherwise (e.g. if auth is
     * disabled, or if another auth provider like ldap is in use)
     */
    supportsNativeAuth: node => {
        // See issue #27 for what's going on here.  DB must support native auth
        // in order for us to expose some features, such as user management.
        const authQ = `
            CALL dbms.listConfig() YIELD name, value 
            WHERE name =~ 'dbms.security.auth_provider.*' 
            RETURN value;`;
        const authPromise = node.run(authQ, {})
            .then(results => {
                let nativeAuth = false;

                results.records.forEach(rec => {
                    const val = rec.get('value');
                    const valAsStr = `${val}`; // Coerce ['foo','bar']=>'foo,bar' if present

                    if (valAsStr.indexOf('native') > -1) {
                        nativeAuth = true;
                    }
                });

                return nativeAuth;
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
    },

    /**
     * @returns Array of { name, lastUpdated } metrics supported by the server.
     */
    getAvailableMetrics: node => {
        const prom = node.run(queryLibrary.LIST_METRICS.query, {})
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
    },
};
