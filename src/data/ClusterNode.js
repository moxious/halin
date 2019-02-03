import Parser from 'uri-parser';
import sentry from '../sentry/index';
import _ from 'lodash';
import math from 'mathjs';
import Ring from 'ringjs';
import queryLibrary from '../data/query-library';
import featureProbes from '../feature/probes';

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

        const allProbes = [componentsPromise];

        allProbes.push(featureProbes.supportsNativeAuth(this)
            .then(result => { this.dbms.nativeAuth = result; }));
        allProbes.push(featureProbes.authEnabled(this)
            .then(result => { this.dbms.authEnabled = result; }));
        allProbes.push(featureProbes.csvMetricsEnabled(this)
            .then(result => { this.dbms.csvMetricsEnabled = result; }));
        allProbes.push(featureProbes.hasAPOC(this)
            .then(result => { this.dbms.apoc = result; }));

        return Promise.all(allProbes)
            .then(whatever => {
                if (this.isCommunity()) {
                    // #operability As a special exception, community will fail 
                    // the test to determine if a node supports native auth -- but it
                    // does.  It fails because community doesn't have the concept of
                    // auth providers.
                    this.dbms.nativeAuth = true;
                }

                session.close();
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