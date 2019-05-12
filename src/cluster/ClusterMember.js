import Parser from 'uri-parser';
import _ from 'lodash';
import math from 'mathjs';
import Ring from 'ringjs';
import featureProbes from '../feature/probes';
import neo4j from '../driver/index';
import queryLibrary from '../data/queries/query-library';
import sentry from '../sentry';
import HalinQuery from '../data/queries/HalinQuery';

const MAX_OBSERVATIONS = 500;

/**
 * Abstraction that captures details and information about a node in a cluster.
 * For each node in a cluster, this abstraction lets you:
 *  - Run queries keeping track of performance and errors over time
 *  - Inspect the node easily to determine what features it supports
 *  - Gather performance data about how responsive it is
 */
export default class ClusterMember {
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
        this.pool = neo4j.getSessionPool(this.id, this.driver, 15);
    }

    shutdown() {
        return this.pool.drain()
            .then(() => this.pool.clear());
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

    supportsLogStreaming() {
        return this.dbms.logStreaming;
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

    supportsDBStats() {
        return this.dbms.hasDBStats;
    }

    getCypherSurface() {
        const extractRecordsWithType = (results, t) => results.records.map(rec => ({
            name: rec.get('name'),
            signature: rec.get('signature'),
            description: rec.get('description'),
            roles: rec.has('roles') ? rec.get('roles') : [],
            type: t,
        }));

        const functionsPromise = this.run(queryLibrary.DBMS_FUNCTIONS)
            .then(results => extractRecordsWithType(results, 'function'));
        const procsPromise = this.run(queryLibrary.DBMS_PROCEDURES)
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

        return featureProbes.getAvailableMetrics(this)
            .then(metrics => { 
                this.metrics = metrics;
                return metrics;
            });
    }

    getVersion() {        
        if (_.isNil(_.get(this.dbms, 'versions'))) {
            return { major: 'unknown', minor: 'unknown', patch: 'unknown' };
        } else if (this.dbms.versions.length > 1) {
            sentry.warn("This ClusterMember has more than one version installed; only using the first");
        }

        const v = this.dbms.versions[0];
        const parts = v.split('.');
        return {
            major: parts[0] || 'unknown',
            minor: parts[1] || 'unknown',
            patch: parts[2] || 'unknown',
        };
    }

    checkComponents() {
        if (!this.driver) {
            throw new Error('ClusterMember has no driver');
        }

        // Probes get individual pieces of information then assign them into our structure,
        // so we can drive feature request functions for outside callers.
        const allProbes = [
            featureProbes.getNameVersionsEdition(this)
                .then(result => { this.dbms = _.merge(_.cloneDeep(this.dbms), result); }),
            featureProbes.supportsNativeAuth(this)
                .then(result => { this.dbms.nativeAuth = result; }),
            featureProbes.authEnabled(this)
                .then(result => { this.dbms.authEnabled = result; }),
            featureProbes.csvMetricsEnabled(this)
                .then(result => { this.dbms.csvMetricsEnabled = result; }),
            featureProbes.hasAPOC(this)
                .then(result => { this.dbms.apoc = result; }),
            featureProbes.hasLogStreaming(this)
                .then(result => { this.dbms.logStreaming = result; }),
            featureProbes.getAvailableMetrics(this)
                .then(metrics => { this.metrics = metrics; }),
            featureProbes.hasDBStats(this)
                .then(result => { this.dbms.hasDBStats = result }),
        ];

        return Promise.all(allProbes)
            .then(whatever => {
                if (this.isCommunity()) {
                    // #operability As a special exception, community will fail 
                    // the test to determine if a node supports native auth -- but it
                    // does.  It fails because community doesn't have the concept of
                    // auth providers.
                    this.dbms.nativeAuth = true;
                }

                // { major, minor, patch }
                _.set(this.dbms, 'version', this.getVersion());

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
     * @param {String | HalinQuery} query a cypher query
     * @param {Object} params parameters to pass to the query.
     * @returns {Promise} which resolves to a neo4j driver result set
     */
    run(query, params = {}) {
        if (!this.driver) { throw new Error('ClusterMember has no driver!'); }
        if (!query) { throw new Error('Missing query'); }

        let s;

        const start = new Date().getTime();
        return this.pool.acquire()
            .then(session => {
                s = session;
                // #operability: transaction metadata is disabled because it causes errors
                // in 3.4.x, and is only available in 3.5.x.
                let transactionConfig = {};

                if (this.dbms.version && this.dbms.version.major >= 3 && this.dbms.version.minor >= 5) {
                    transactionConfig = queryLibrary.queryMetadata;
                }

                if (query instanceof HalinQuery) {
                    return session.run(query.getQuery(), params);
                }
                
                return session.run(query, params, transactionConfig);
            })
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
            // Cleanup session.
            .finally(() => {
                return this.pool.release(s)
                    .catch(e => sentry.fine('Pool release error', e));
            });
    }
}
