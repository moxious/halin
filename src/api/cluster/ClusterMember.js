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
import Database from '../Database';

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

    // #operability: between 3.5 and 4.0 they renamed the role...these are effectively the same
    // thing
    static ROLE_SINGLE = 'SINGLE';
    static ROLE_STANDALONE = 'STANDALONE';

    /**
     * Input is a record that comes back from dbms.cluster.overview()
     */
    constructor(record) {
        if (record.has('databases')) {
            // >= Neo4j 4.0
            // TODO: Raft roles can separate in 4.0. If you're the leader for one
            // DB you're not necessarily the leader for all of them.
            // Under 4.0 asking whether a node is "the leader" is a bit of a 
            // meaningless question, but this is maintained for backwards compat.
            const dbs = record.get('databases');
            Object.keys(dbs).forEach(dbName => {
                const role = dbs[dbName];
                this.role = role;
            });

            // Maps database name to member role
            this.database = dbs;
        } else {
            this.role = (record.get('role') || '').trim();
            // TODO -- pre-Neo4j 4.0, do we ever need this value?
            // I can't think of a use for it.
            // const key = record.get('database');
            const value = this.role;

            // We're going to rename to neo4j because that's the default
            // database name for older Neo4j's, but still keep what it told
            // us.
            const obj = { [Database.SINGLEDB_NAME]: value };

            // Maps database name to member role
            this.database = obj;
        }

        this.standalone = record.has('standalone') ? record.get('standalone') : false;
        this.id = record.get('id');
        this.addresses = record.get('addresses');
        this.groups = record.get('groups');
        this.dbms = {};
        this.driver = null;
        this.observations = new Ring(MAX_OBSERVATIONS);
        this.errors = {};
        this.pluggedIn = true;  // Whether or not the member is noticeably online and responsive.
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
        details.standalone = true;

        const member = new ClusterMember(details);
        const driver = halin.driverFor(member.getBoltAddress());
        member.setDriver(driver);
        return member;
    }

    getId() { return this.id; }

    /**
     * Merges changes with an existing member of the same ID
     * @param {ClusterMember} changes 
     * @returns true if something changed, false otherwise.
     * @throws {Error} if the IDs don't match
     */
    merge(changes) {
        if (!changes.getId() === this.getId()) {
            throw new Error('Cannot merge changes with a different member ID');
        }

        // The things that change are addresses, groups, and critically, databases which tells us who is leader
        // of what.
        let changed = false;

        if (!_.isEqual(this.addresses, changes.addresses)) {
            this.addresses = _.cloneDeep(changes.addresses);
            sentry.fine(`${this.getBoltAddress()} addresses changed: `, this.addresses, changes.addresses);
            changed = true;
        }

        if (!_.isEqual(this.groups, changes.groups)) {
            this.groups = _.cloneDeep(changes.groups);
            sentry.fine(`${this.getBoltAddress()} groups changed`, this.groups, changes.groups);
            changed = true;
        }

        if (!_.isEqual(this.database, changes.database)) {
            this.database = _.cloneDeep(changes.database);
            sentry.fine(`${this.getBoltAddress()} database changed`, this.database, changes.database);
            changed = true;
        }

        return changed;
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
            stdev: obs.length > 0 ? math.std(...obs) : 0,
            mean: obs.length > 0 ? math.mean(...obs) : 0,
            median: obs.length > 0 ? math.median(...obs) : 0,
            mode: obs.length > 0 ? math.mode(...obs) : 0,
            min: obs.length > 0 ? math.min(...obs) : 0,
            max: obs.length > 0 ? math.max(...obs) : 0,
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

    getPort() {
        const parsed = Parser.parse(this.getBoltAddress());
        return parsed.port || 7687;
    }

    getAddress() {
        const parsed = Parser.parse(this.getBoltAddress());
        return parsed.host;
    }

    getLabel() {
        const parts = Parser.parse(this.getBoltAddress());

        const addr = parts.host || 'NO_ADDRESS';
        parts.port = parts.port || '7687';

        // Add the port on only if it's non-standard.  This also helps
        // disambiguate when localhost is used 3x.
        const port = parts.port === '7687' ? '' : ':' + parts.port;

        if (addr.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)) {
            // IP address
            return addr + port;
        }

        // Return the first portion of the hostname.
        return addr.split('.')[0] + port;
    }

    protocols() {
        return this.addresses
            .map(addr => Parser.parse(addr))
            .map(parsed => parsed.protocol);
    }

    isLeader() { return this.role === ClusterMember.ROLE_LEADER; }
    isFollower() { return this.role === ClusterMember.ROLE_FOLLOWER; }
    isSingle() { return this.role === ClusterMember.ROLE_SINGLE || this.role === ClusterMember.ROLE_STANDALONE; }
    isReadReplica() { return this.role === ClusterMember.ROLE_REPLICA; }

    isCore() {
        return this.isLeader() || this.isFollower() || this.isSingle();
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

        if (_.isNil(db)) { return this.isLeader(); }
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

    usesFabric() {
        return this.dbms.fabric;
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
        const ver = {
            major: parts[0] || 'unknown',
            minor: parts[1] || 'unknown',
            patch: parts[2] || 'unknown',
        };

        const extra = ver.patch.split('-');
        if (extra.length > 1) {
            ver.patch = extra[0];
            ver.extra = extra[1];
        }

        return ver;
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

    /**
     * @returns {Promise} that resolves to the member's configuration, key=>value.
     */
    getConfiguration() {
        // TODO -- config is loaded once and only once and then cached, because
        // it barely changes in Neo4j.  There are EXCEPTIONS in terms of a very
        // small number of dynamic config options (#operability).  So consider 
        // polling later if it's important to pick up changes in those.
        if (!_.isNil(this.configuration)) {
            return Promise.resolve(this.configuration);
        }

        return this.run('CALL dbms.listConfig()', {})
            .then(results => {
                const configMap = {};
                results.records.forEach(rec => {
                    const key = rec.get('name');
                    const value = rec.get('value');

                    // Configs can have duplicate keys! #operability
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
            .then(configMap => {
                this.configuration = configMap;
                return this.configuration;
            })
            .catch(err => {
                if (neo4jErrors.permissionDenied(err)) {
                    this.configuration = {};
                    return;
                }
                throw err;
            });
    }

    /**
     * Get a Neo4j configuration entry for this member
     * @param {*} confSetting the name of the setting, e.g. dbms.memory.heap.max_size
     * @returns {String} the value of the setting
     * @throws {Error} if the member hasn't been initialized yet.
     */
    getConfigurationValue(confSetting) {
        if (_.isNil(this.configuration)) {
            throw new Error('Make sure to call getConfiguration() first');
        }

        return _.get(this.configuration, confSetting);
    }

    checkComponents() {
        if (!this.driver) {
            throw new Error('ClusterMember has no driver');
        }

        // Probes get individual pieces of information then assign them into our structure,
        // so we can drive feature request functions for outside callers.
        // this.dbms ends up looking like this:
        // {
        //     nativeGraph: true,
        //     systemGraph: true,
        //     version: { major: 4, minor: 0, patch: 0 },
        //     maxHeap: 'whatever',
        //     physicalMemory: 'whatever',
        //     hasDBStats: true,
        //     metrics: [],
        //     csvMetricsEnabled: true,
        //     ...
        // }

        if (!this.isOnline()) {
            return Promise.reject('Skipping component check on offline cluster member');
        }

        return featureProbes.runAllProbes(this)
            .then(dbms => {
                this.pluggedIn = true;
                this.dbms = dbms;
            })
            .then(() => {
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
            });    
    }

    markOffline() { this.pluggedIn = false; }
    markOnline() { this.pluggedIn = true; }
    isOnline() { return this.pluggedIn; }

    /**
     * This function just takes note of a transaction success, as a data point/observation,
     * so that we can track ongoing responsiveness/performance.
     * @param {Number} time number of ms elapsed
     */
    _txSuccess(time) {
        this.pluggedIn = true;
        // It's a ring not an array, so it cannot grow without bound.
        this.observations.push({ x: new Date(), y: time });
    }

    /**
     * This function does nothing other than take internal note that an error occurred,
     * so that we can accumulate information about what errors we've seen and provide
     * feedback to users.
     * @param {Error} err 
     */
    _txError(err) {
        if(neo4jErrors.failedToEstablishConnection(err) || 
            neo4jErrors.repeatedAuthFailure(err) || 
            neo4jErrors.connectionRefused(err)) {
            this.pluggedIn = false;
        }

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
                if (poolSession) {
                    this.pool.release(s).catch(e => sentry.fine('Pool release error', e));
                } else {
                    s.close();
                }

                return p;
            });
    }
}
