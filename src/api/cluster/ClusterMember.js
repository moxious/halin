import Parser from 'uri-parser';
import _ from 'lodash';
import Promise from 'bluebird';
import math from 'mathjs';
import Ring from 'ringjs';
import featureProbes from '../feature/probes';
import neo4j from '../driver/index';
import neo4jErrors from '../driver/errors';
import queryLibrary from '../data/queries/query-library';
import sentry from '../sentry';
import HalinQuery from '../data/queries/HalinQuery';
import score from '../cluster/health/score';

const MAX_OBSERVATIONS = 100;

/**
 * Abstraction that captures details and information about a node in a cluster.
 * For each node in a cluster, this abstraction lets you:
 *  - Run queries keeping track of performance and errors over time
 *  - Inspect the node easily to determine what features it supports
 *  - Gather performance data about how responsive it is
 */
export default class ClusterMember {
    static ROLE_LEADER = 'LEADER';
    static ROLE_FOLLOWER = 'FOLLOWER';
    static ROLE_REPLICA = 'READ_REPLICA';

    /**
     * Input is a record that comes back from dbms.cluster.overview()
     */
    constructor(record) {
        if (record.has('databases')) {
            // >= Neo4j 4.0
            // TODO: Raft roles can't separate in 4.0. If you're the leader for one
            // DB you're th e leader for all of them and so forth.
            // THIS IS A LIMITED ASSUMPTION FOR 4.0 AND WILL CHANGE.
            // But this assumption is specifically why any role is fine to take as
            // the cluster member's role.
            const dbs = record.get('databases');
            Object.keys(dbs).forEach(dbName => {
                const role = dbs[dbName];
                this.role = role;
            });

            // Maps database name to member role
            this.database = dbs;
        } else {
            this.role = (record.get('role') || '').trim();
            const key = record.get('database');
            const value = this.role;
            const obj = { [key]: value };

            // Maps database name to member role
            this.database = obj;
        }

        this.id = record.get('id');
        this.addresses = record.get('addresses');
        this.groups = record.get('groups');
        this.dbms = {};
        this.driver = null;
        this.observations = new Ring(MAX_OBSERVATIONS);
        this.errors = {};
    }

    /**
     * When Neo4j is in standalone mode (non CC) Halin fakes this as a cluster of 1 member.
     * This provides some basic details (id, addresses, role, database) and creates a member
     * from that.
     * @param {Object} details 
     */
    static makeStandalone(halin, details) {
        // Psuedo object behaves like a cypher result record.
        // Somewhere, a strong typing enthusiast is screaming. ;)
        const get = key => details[key];
        const has = key => !_.isNil(details[key]);
        details.get = get;
        details.has = has;

        const member = new ClusterMember(details);
        const driver = halin.driverFor(member.getBoltAddress());
        member.setDriver(driver);
        return member;
    }

    /**
     * Returns the roles this member plays for a given set of databases.  Object is
     * a mapping of database name (string) to database role (leader, follower, etc)
     * @returns {Object} database name/role mappings
     */
    getDatabaseRoles() {
        return _.cloneDeep(this.database);
    }

    /**
     * Returns an object with health score information about the current status of this
     * member.  This is done by examining response rates from various datafeeds.
     */
    getHealthScore(halin) {
        return score.feedFreshness(halin, this);
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
            writer: this.canWrite(),
            database: this.database,
            id: this.id,
            groups: this.groups,
            label: this.getLabel(),
            dbms: this.dbms,
            performance: this.performance(),
            pool: {
                size: this.pool.size,
                available: this.pool.available,
                borrowed: this.pool.borrowed,
                pending: this.pool.pending,
                min: this.pool.min,
                max: this.pool.max,
            },
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
        const addr = this.getAddress() || 'NO_ADDRESS';
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

    isLeader() { return this.role === 'LEADER'; }
    isFollower() { return this.role === 'FOLLOWER'; }
    isSingle() { return this.role === 'SINGLE'; }
    isReadReplica() { return this.role === 'READ_REPLICA'; }

    isCore() {
        return this.isLeader() || this.isSingle();
    }

    /**
     * Determine whether or not this member can write to this database.
     * If the database is standalone, the answer is always yes no matter the input.
     * If the database is clustered, then this will return if it's the leader (pre Neo4j 4.0)
     * and for Neo4j >= 4.0 (multidatabase) will return true only if that machine is leader
     * for that database.
     * 
     * @param {String} db database name
     */
    canWrite(db = null) {
        if (this.isSingle()) { return true; }

        if (db === null) { return this.isLeader(); }
        return this.database[db] === 'LEADER';
    }

    /**
     * Returns true if the context is attached to a Neo4j Enterprise edition server,
     * false otherwise.
     */
    isEnterprise() {
        return this.dbms.edition === 'enterprise' || this.dbms.edition === 'commercial';
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

    supportsMultiDatabase() {
        return this.dbms.multidatabase;
    }

    /**
     * Returns true if the context provides for native auth management, false otherwise.
     */
    supportsNativeAuth() {
        return this.dbms.nativeAuth;
    }

    supportsSystemGraph() { return this.dbms.systemGraph; }

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

        const v = this.dbms.versions[0] || '';
        const parts = v.split('.');
        return {
            major: parts[0] || 'unknown',
            minor: parts[1] || 'unknown',
            patch: parts[2] || 'unknown',
        };
    }

    getMaxPhysicalMemory() {
        return this.run(queryLibrary.OS_MEMORY_STATS)
            .then(results => {
                const rec = results.records[0];
                return neo4j.handleNeo4jInt(rec.get('physTotal'));
            })
            .catch(err => {
                if (neo4jErrors.permissionDenied(err)) {
                    return 'unknown';
                }
                throw err;
            });
    }

    getMaxHeap() {
        return this.run(queryLibrary.DBMS_GET_MAX_HEAP)
            .then(results => {
                const rec = results.records[0];
                return rec.get('value');
            })
            .catch(err => {
                if (neo4jErrors.permissionDenied(err)) {
                    return 'unknown';
                }
                throw err;
            })
    }

    checkComponents() {
        if (!this.driver) {
            throw new Error('ClusterMember has no driver');
        }

        // Probes get individual pieces of information then assign them into our structure,
        // so we can drive feature request functions for outside callers.
        // These are functions so that the async call doesn't start until we call it.
        const allProbes = [
            () => featureProbes.getNameVersionsEdition(this)
                .then(result => { this.dbms = _.merge(_.cloneDeep(this.dbms), result); }),
            () => featureProbes.supportsNativeAuth(this)
                .then(result => {
                    this.dbms.nativeAuth = result.nativeAuth;
                    this.dbms.systemGraph = result.systemGraph;
                }),
            () => featureProbes.authEnabled(this)
                .then(result => { this.dbms.authEnabled = result; }),
            () => featureProbes.csvMetricsEnabled(this)
                .then(result => { this.dbms.csvMetricsEnabled = result; }),
            () => featureProbes.hasAPOC(this)
                .then(result => { this.dbms.apoc = result; }),
            () => featureProbes.hasLogStreaming(this)
                .then(result => { this.dbms.logStreaming = result; }),
            () => featureProbes.getAvailableMetrics(this)
                .then(metrics => { this.metrics = metrics; }),
            () => featureProbes.hasDBStats(this)
                .then(result => { this.dbms.hasDBStats = result }),
            () => featureProbes.hasMultiDatabase(this)
                .then(result => { this.dbms.multidatabase = result }),
            () => this.getMaxHeap().then(maxHeap => {
                this.dbms.maxHeap = maxHeap;
            }),
            () => this.getMaxPhysicalMemory().then(maxPhysMemory => {
                this.dbms.physicalMemory = maxPhysMemory;
            }),
        ];

        const s = new Date().getTime();

        // When halin is first starting, doing all of these things in parallel can a bit
        // spam the server with new connections, so we limit concurrency which is friendlier
        // and also results in faster startup times.
        return Promise.map(allProbes, f => f(), { concurrency: 2 })
            .then(whatever => {
                if (this.isCommunity()) {
                    // #operability As a special exception, community will fail 
                    // the test to determine if a node supports native auth -- but it
                    // does.  It fails because community doesn't have the concept of
                    // auth providers.
                    this.dbms.nativeAuth = true;
                }

                if (this.dbms.multidatabase) {
                    this.dbms.systemGraph = true;
                }

                // { major, minor, patch }
                _.set(this.dbms, 'version', this.getVersion());

                const e = new Date().getTime() - s;
                sentry.fine(this.getLabel(), 'initialization', e, 'ms elapsed');
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
     * @param database the name of the database to run the query against
     * @returns {Promise} which resolves to a neo4j driver result set
     */
    run(query, params = {}, database = null) {
        if (!this.driver) { throw new Error('ClusterMember has no driver!'); }
        if (!query) { throw new Error('Missing query'); }

        let s;

        const start = new Date().getTime();

        let poolSession;

        /*
         * Sessions work differently depending on Neo4j 3 vs. 4.
         * In 4, sessions can be bound to a particular database.  In 3
         * they never are because 3 doesn't contain multidatabase functionality.
         */
        const getSessionPromise = () => {
            // NOTE/GOTCHA: we are *intentionally* ignoring the 'database' parameter if
            // major version is < 4, because a database specific query doesn't
            // make sense in 3.5.x. 
            // This comes up most commonly with system commands like
            // call dbms.security.listUsers() which must be run against systemdb in
            // Neo4j 4, but with 3.5.x if you try to run the query against a specific
            // database, the driver will fail it because you're not using >= 4.
            if (!database || this.getVersion().major < 4) {
                poolSession = true;
                return this.pool.acquire();
            }

            poolSession = false;
            return Promise.resolve(this.driver.session({ database }));
        };

        return getSessionPromise()
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
            .finally(p => {
                return poolSession ? this.pool.release(s)
                    .catch(e => sentry.fine('Pool release error', e)) : p;
            });
    }
}
