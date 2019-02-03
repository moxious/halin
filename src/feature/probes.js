import sentry from '../sentry/index';
import neo4jErrors from '../driver/errors';

/**
 * A feature probe is a bit of code that runs against a cluster node to determine whether or not
 * that node has a certain feature or not.
 * 
 * They all take a node as an argument and return true/false or a small piece of data.
 */
export default {
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
};
