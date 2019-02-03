import Parser from 'uri-parser';
import sentry from '../sentry/index';
import neo4jErrors from '../driver/errors';
import _ from 'lodash';
import math from 'mathjs';
import Ring from 'ringjs';
import queryLibrary from '../data/query-library';

const MAX_OBSERVATIONS = 500;

/**
 * Abstraction that captures details and information about a node in a cluster.
 */
export default class ClusterNode {
    /**
     * Input is a record that comes back from dbms.cluster.overview()
     */
    constructor(record) {
        this.id = record.get('id');
        this.addresses = record.get('addresses');
        this.role = (record.get('role') || '').trim();
        this.database = record.get('database');
        this.dbms = {};
        this.driver = null;
        this.observations = new Ring(MAX_OBSERVATIONS);
        this.errors = {};
    }

    /**
     * Set the default driver to use for the cluster node instance
     */
    setDriver(driver) {
        this.driver = driver;
    }

    performance() {
        const obs = this.observations.toArray().map(i => i.y);
        return {
            stdev: math.std(...obs),
            mean: math.mean(...obs),
            median: math.median(...obs),
            mode: math.mode(...obs),
            min: math.min(...obs),
            max: math.max(...obs),
            errors: this.errors,
            observations: this.observations.toArray(),
        };
    }

    asJSON() {
        return {
            address: this.getBoltAddress(),
            procotols: this.protocols(),
            role: this.role,
            database: this.database,
            id: this.id,
            label: this.getLabel(),
            dbms: this.dbms,
            performance: this.performance(),
        };
    }

    /**
     * Gets the raw query timing observations seen on this node.
     * @returns {Ring} a ring of observation data points with x, y.
     */
    getObservations() { return this.observations; }

    getBoltAddress() {
        if (this.boltAddress) {
            return this.boltAddress;
        }
        this.boltAddress = this.addresses.filter(addr => addr.indexOf('bolt') > -1)[0];
        return this.boltAddress;
    }

    getAddress() {
        const parsed = Parser.parse(this.getBoltAddress());
        return parsed.host;
    }

    getLabel() {
        const addr = this.getAddress();
        if (addr.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)) {
            // IP address
            return addr;
        }

        // Return the first portion of the hostname.
        return addr.split('.')[0];
    }

    protocols() {
        return this.addresses
            .map(addr => Parser.parse(addr))
            .map(parsed => parsed.protocol);
    }

    /**
     * Returns true if the context is attached to a Neo4j Enterprise edition server,
     * false otherwise.
     */
    isEnterprise() {
        return this.dbms.edition === 'enterprise';
    }
    
    isCommunity() {
        return !this.isEnterprise();
    }

    supportsAPOC() {
        return this.dbms.apoc;
    }

    /**
     * If true, this cluster node has CSV metrics enabled which, with APOC, we can 
     * access.
     */
    csvMetricsEnabled() {
        return this.dbms.csvMetricsEnabled;
    }

    /**
     * Returns true if the context provides for native auth management, false otherwise.
     */
    supportsNativeAuth() {
        return this.dbms.nativeAuth;
    }

    /**
     * Returns true if auth is enabled on this node.
     */
    supportsAuth() {
        return this.dbms.authEnabled === 'true';
    }

    getCypherSurface() {
        const session = this.driver.session();

        const extractRecordsWithType = (results, t) => results.records.map(rec => ({
            name: rec.get('name'),
            signature: rec.get('signature'),
            description: rec.get('description'),
            roles: rec.get('roles'),
            type: t,
        }));

        const functionsPromise = session.run('CALL dbms.functions()', {})
            .then(results => extractRecordsWithType(results, 'function'));
        const procsPromise = session.run('CALL dbms.procedures()', {})
            .then(results => extractRecordsWithType(results, 'procedure'));

        return Promise.all([functionsPromise, procsPromise])
            .then(results => _.flatten(results));
    }

    /**
     * Gets a list of metrics that the node has available, as per:
     * https://neo4j.com/docs/operations-manual/current/monitoring/metrics/expose/#metrics-csv
     * 
     * Guaranteed this promise won't fail, but it may return [] if the node doesn't support
     * metrics.
     * 
     * @return Promise that resolves to an array of objects.
     */
    getAvailableMetrics() {
        if (!_.isNil(this.metrics)) {
            return Promise.resolve(this.metrics);
        }

        return this.run(queryLibrary.LIST_METRICS.query, {})
            .then(results =>
                results.records.map(r => ({
                    name: r.get('name'),
                    lastUpdated: r.get('lastUpdated'),
                    path: r.get('path'),
                })))
            .then(metrics => {
                this.metrics = metrics;
                return metrics;
            })
            .catch(err => {
                this.metrics = [];
                sentry.reportError('Failed to list metrics', err);
            })
            .then(() => this.metrics);
    }

    checkComponents() {
        if (!this.driver) {
            throw new Error('ClusterNode has no driver');
        }

        const q = 'call dbms.components()';
        const session = this.driver.session();

        const componentsPromise = session.run(q, {})
            .then(results => {
                const rec = results.records[0];
                this.dbms.name = rec.get('name')
                this.dbms.versions = rec.get('versions');
                this.dbms.edition = rec.get('edition');
            })
            .catch(err => {
                sentry.reportError(err, 'Failed to get DBMS components; this can be because user is not admin');
                this.dbms.name = 'UNKNOWN';
                this.dbms.versions = [];
                this.dbms.edition = 'UNKNOWN';
            });

        // See issue #27 for what's going on here.  DB must support native auth
        // in order for us to expose some features, such as user management.
        const authQ = `
            CALL dbms.listConfig() YIELD name, value 
            WHERE name =~ 'dbms.security.auth_provider.*' 
            RETURN value;`;
        const authPromise = session.run(authQ, {})
            .then(results => {
                let nativeAuth = false;

                results.records.forEach(rec => {
                    const val = rec.get('value');
                    const valAsStr = `${val}`; // Coerce ['foo','bar']=>'foo,bar' if present

                    if (valAsStr.indexOf('native') > -1) {
                        nativeAuth = true;
                    }
                });

                this.dbms.nativeAuth = nativeAuth;
            })
            .catch(err => {
                if (neo4jErrors.permissionDenied(err)) {
                    // Read only user can't do this, so we can't tell whether native
                    // auth is supported.  So disable functionality which requires this.
                    this.dbms.nativeAuth = false;
                    return;    
                }

                sentry.reportError(err, 'Failed to get DBMS auth implementation type');
                this.dbms.nativeAuth = false;
            });

        const authEnabledQ = `
            CALL dbms.listConfig() YIELD name, value
            WHERE name =~ 'dbms.security.auth_enabled'
            RETURN value;
        `;
        const authEnabledPromise = session.run(authEnabledQ, {})
            .then(results => {
                let authEnabled = true;
                results.records.forEach(rec => {
                    const val = rec.get('value');
                    authEnabled = `${val}`;
                });
                this.dbms.authEnabled = authEnabled;
            })
            .catch(err => {
                if (neo4jErrors.permissionDenied(err)) {
                    this.dbms.authEnabled = false;
                    return;
                }

                sentry.reportError(err, 'Failed to check auth enabled status');
                this.dbms.authEnabled = true;
            });

        const csvMetricsProbePromise = session.run(`
            CALL dbms.listConfig() 
            YIELD name, value 
            WHERE name='metrics.csv.enabled' 
            return value;`, {})
                .then(results => {
                    const row = results.records[0];
                    if (row && row.get('value') === 'true') {
                        this.dbms.csvMetricsEnabled = true;
                    } else {
                        sentry.fine('CSV metrics not enabled', row);
                    }
                })
                .catch(err => {
                    sentry.fine('Error on CSV metrics enabled probe', err);
                    this.dbms.csvMetricsEnabled = false;
                });

        const apocProbePromise = session.run('RETURN apoc.version()', {})
            .then(results => {
                this.dbms.apoc = true;
            })
            .catch(err => {
                const str = `${err}`;

                // Either way APOC isn't present, but only log the error if it's exotic.
                // If it errors with unknown function, that's how you know APOC isn't installed.
                if (str.indexOf('Unknown function') === -1) {
                    sentry.reportError('APOC probe failed', err);
                }
                this.dbms.apoc = false;
            });

        return Promise.all([
            componentsPromise, 
            authPromise,
            apocProbePromise,
            csvMetricsProbePromise,
            authEnabledPromise])
            .then(whatever => {
                if (this.isCommunity()) {
                    // #operability As a special exception, community will fail 
                    // the test to determine if a node supports native auth -- but it
                    // does.  It fails because community doesn't have the concept of
                    // auth providers.
                    this.dbms.nativeAuth = true;
                }

                return whatever;
            });
    }

    _txSuccess(time) {
        // It's a ring not an array, so it cannot grow without bound.
        this.observations.push({ x: new Date(), y: time });
    }

    _txError(err) {
        const str = `${err}`;
        if (_.has(this.errors, str)) {
            this.errors[str] = this.errors[str] + 1;
        } else {
            this.errors[str] = 1;
        }

        return this.errors[str];
    }

    /**
     * This function behaves just like neo4j driver session.run, but manages
     * session creation/closure for you, and gathers metrics about the run so
     * that we can track the cluster node's responsiveness and performance over time.
     * @param {String} query a cypher query
     * @param {Object} params parameters to pass to the query.
     */
    run(query, params={}) {
        if (!this.driver) { throw new Error('ClusterNode has no driver!'); }

        const session = this.driver.session();

        const start = new Date().getTime();        
        return session.run(query, params)
            .then(results => {
                const elapsed = new Date().getTime() - start;
                this._txSuccess(elapsed);
                // Guarantee same result set to outer user.
                return results;
            })
            .catch(err => {
                this._txError(err);
                // Guarantee same thrown response to outer user.
                throw err;
            })
            .finally(() => session.close());  // Cleanup session.
    }
}