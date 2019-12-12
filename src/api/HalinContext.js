import _ from 'lodash';
import Promise from 'bluebird';
import sentry from './sentry/index';
import neo4j from './driver';
import neo4jErrors from './driver/errors';

import ClusterManager from './cluster/ClusterManager';
import ClusterMemberSet from './cluster/ClusterMemberSet';
import DatabaseSet from './DatabaseSet';
import DataFeed from './data/DataFeed';

/**
 * HalinContext is a controller object that keeps track of state and permits diagnostic
 * reporting.
 * 
 * It creates its own drivers and does not use the Neo4j Desktop API provided drivers.
 * The main app will attach it to the window object as a global.
 * 
 * The main 3 functions this object provides are:
 * - A ClusterMemberSet corresponding to who is in the cluster
 * - A ClusterManager that allows bulk operations cluster wide
 * - A set of driver management functions so that you can talk to any particular node
 * you need.
 * 
 * This last one is important, because HalinContext acts as the broker of the mapping between
 * a set of databases and a set of cluster members.  As of Neo4j 4.0, there is a many-to-many
 * mapping between these items.  In order to route the right query the right way, while being
 * connected to each node individually, this mapping has to be maintained.
 */
export default class HalinContext {
    static connectionDetails = null;

    constructor() {
        this.drivers = {};
        this.dataFeeds = {};
        this.pollRate = 1000;
        this.memberSet = new ClusterMemberSet();
        this.dbSet = new DatabaseSet();
        this.driverOptions = {
            connectionTimeout: 15000,
            trust: 'TRUST_CUSTOM_CA_SIGNED_CERTIFICATES',
        };
        this.debug = false;
        this.mgr = new ClusterManager(this);
        this.mgr.addListener(e => this.onClusterEvent(e));
    }

    /**
     * @returns {Array[ClusterMember]}
     */
    members() {
        return this.memberSet.members();
    }

    /**
     * @returns {Array[Database]}
     */
    databases() { 
        return this.dbSet.databases();
    }

    getMemberSet() { return this.memberSet; }
    getDatabaseSet() { return this.dbSet; }

    getWriteMember() {
        const writer = this.memberSet.members().filter(cm => cm.canWrite())[0];

        if (!writer) {
            throw new Error(`
                Cluster has no write members! This could mean that it is broken,
                or is currently undergoing a leader election.
            `);
        }

        return writer;
    }

    /**
     * Get the leader of systemdb.  You'd want to
     * know this if you're running a mutating query on systemdb (privileges and such).
     * Pre Neo4j 4.0, this concept didn't exist, and systemdb didn't exist.  If you're
     * connected to a pre Neo4j 4.0 database, then there is only *1* leader, and you'll
     * get that member.  If you're connected to a standalone database, you'll get the
     * only member.
     * @returns {ClusterMember} that is the leader for systemdb.  
     */
    getSystemDBWriter() {
        const writer = this.memberSet.members().filter(cm => cm.canWrite(neo4j.SYSTEM_DB))[0];

        if (!writer) {
            const str = JSON.stringify(this.memberSet.members().map(m => m.asJSON()), null, 2);
            // throw new Error(`No systemdb writer in all of ${str}`);
        }

        return writer;
    }

    getPollRate() {
        return this.pollRate;
    }

    /**
     * @returns {ClusterManager}
     */
    getClusterManager() {
        return this.mgr;
    }

    getFeedsFor(clusterMember) {
        return _.values(this.dataFeeds).filter(df => df.node === clusterMember);
    }

    getDataFeed(feedOptions) {
        const df = new DataFeed(feedOptions);
        const feed = this.dataFeeds[df.name];
        if (feed) {
            return feed;
        }
        this.dataFeeds[df.name] = df;
        // sentry.fine('Halin starting new DataFeed: ', df.name.slice(0, 120) + '...');
        df.start();
        return df;
    }

    /**
     * Create a new driver for a given address.
     */
    driverFor(addr, username = _.get(this.base, 'username'), password = _.get(this.base, 'password')) {
        const tlsLevel = _.get(this.base, 'tlsLevel');
        const encrypted = (tlsLevel === 'REQUIRED' ? true : false);

        if (this.drivers[addr]) {
            return this.drivers[addr];
        }

        const allOptions = _.merge({ encrypted }, this.driverOptions);
        if (this.debug) {
            sentry.fine('Driver connection', { addr, username, allOptions });
        }
        const driver = neo4j.driver(addr,
            neo4j.auth.basic(username, password), allOptions);
        sentry.fine('Driver', addr);
        this.drivers[addr] = driver;
        return driver;
    }

    shutdown() {
        sentry.info('Shutting down halin context');
        _.values(this.dataFeeds).map(df => df.stop());
        this.memberSet.shutdown();
        _.values(this.drivers).map(driver => driver.close());
        this.getClusterManager().addEvent({
            type: 'halin',
            message: 'Halin monitoring shut down',
        });
    }

    /**
     * Returns true if the context is attached to a Neo4j Enterprise Edition server
     * with more than one cluster node.
     */
    isCluster() {
        // Must have more than one node
        return this.memberSet.members().length > 1;
    }

    /**
     * Returns true if the context is attached to a Neo4j Enterprise edition server,
     * false otherwise.
     */
    isEnterprise() {
        return this.getWriteMember().isEnterprise();
    }

    isCommunity() {
        return !this.isEnterprise();
    }

    /**
     * @returns true if the HalinContext is attached to a Neo4j Cloud instance, false otherwise.
     */
    isNeo4jAura() {
        const uri = this.getBaseURI();
        return (uri || '').toLowerCase().indexOf('databases.neo4j.io') > -1;
    }

    userIsAdmin() {
        // On community, there are no roles so all users have admin privileges.  Everyone else
        // requires the admin role.
        return !this.isEnterprise() || this.getCurrentUser().roles.indexOf('admin') > -1;
    }

    supportsAPOC() {
        return this.getWriteMember().supportsAPOC();
    }

    supportsLogStreaming() {
        return this.getWriteMember().supportsLogStreaming();
    }

    supportsMetrics() {
        return this.getWriteMember().metrics && this.memberSet.members()[0].metrics.length > 0;
    }

    supportsDBStats() {
        return this.getWriteMember().supportsDBStats();
    }

    /**
     * Returns true if the context provides for native auth management, false otherwise.
     */
    supportsNativeAuth() {
        return this.getWriteMember().supportsNativeAuth();
    }

    /**
     * Returns true if context provides for the system graph, which is generally
     * Neo4j >= 3.6.  False otherwise.
     */
    supportsSystemGraph() {
        return this.getWriteMember().supportsSystemGraph();
    }

    supportsMultiDatabase() {
        return this.getWriteMember().supportsMultiDatabase();
    }

    /**
     * Returns true if the context supports authorization overall.
     */
    supportsAuth() {
        return this.getWriteMember().supportsAuth();
    }

    getVersion() {
        return this.getWriteMember().getVersion();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Listener that fires in ClusterManager whenever a cluster-wide event happens.  This allows the
     * context to be aware of things changing around it and adjust.
     * @param {Object} event with keys date, payload, id, type
     */
    onClusterEvent(event) {
        sentry.info('Cluster Event', event);
    }

    checkUser(driver /*, progressCallback */) {
        const q = 'call dbms.showCurrentUser()';
        const session = driver.session();

        return session.run(q, {})
            .then(results => {
                const rec = results.records[0];

                this.currentUser = {
                    username: rec.get('username'),
                    // Community doesn't have roles.
                    roles: rec.has('roles') ? rec.get('roles') : [],
                    flags: rec.get('flags'),
                };
                
                // sentry.fine('Current User', this.currentUser);
            })
            .catch(err => {
                if (neo4jErrors.noProcedure(err)) {
                    // This occurs when dbms.security.auth_enabled=false and neo4j
                    // does not even expose auth-related procedures.  But it isn't
                    // an error.
                    this.currentUser = {
                        username: 'neo4j',
                        roles: [],
                        flags: [],
                    };
                } else {
                    sentry.reportError(err, 'Failed to get user info');
                    this.currentUser = {
                        username: 'UNKNOWN',
                        roles: [],
                        flags: [],
                    };
                }
            })
            .finally(() => session.close());
    }

    static getConnectionDetailsFromEnvironment() {
        const encryption = process.env.ENCRYPTION_REQUIRED ? 'REQUIRED' : 'OPTIONAL';
        const host = process.env.NEO4J_HOST || 'localhost';
        const port = process.env.NEO4J_PORT || 7687;
        const username = process.env.NEO4J_USERNAME || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'admin';
        return {
            host, port, username, password, enabled: true, tlsLevel: encryption,
        };
    }

    /**
     * Base details are the original connection parameters given at the very start.
     */
    getBaseDetails() {
        return this.base;
    }

    getBaseURI() {
        return `bolt://${this.base.host}:${this.base.port}`;
    }

    /**
     * Returns a promise that resolves to the HalinContext object completed,
     * or rejects.
     * 
     * There are two major code paths here:
     * (1) Running in browser -- in which case we needed to
     * fake the neo4j desktop API facade prior to this step
     * (2) Running in terminal (and window object isn't even defined)
     */
    initialize(progressCallback = msg => console.log(msg)) {
        let inBrowser = true;

        const report = str => {
            if (progressCallback) {
                return progressCallback(str, this);
            }
            return null;
        };

        try {
            // Will fail with ReferenceError if not in a browser.
            // eslint-disable-next-line
            const globalWindow = window;
        } catch (e) {
            inBrowser = false;
        }

        try {
            let getGraphSpecificsPromise = null;

            if (!inBrowser) {
                // Get connection details from the environment variables directly.
                getGraphSpecificsPromise = Promise.resolve(
                    HalinContext.getConnectionDetailsFromEnvironment());
            } else {
                getGraphSpecificsPromise = Promise.resolve(_.cloneDeep(HalinContext.connectionDetails));
            }

            report('Getting database connection');
            return getGraphSpecificsPromise.then(details => {
                    if (_.isNil(details)) {
                        throw new Error('In order to launch Halin, you must have an active database connection');
                    }

                    this.base = _.cloneDeep(details);

                    if (!this.base.password) {
                        // See https://github.com/moxious/halin/issues/100
                        // Arises when the Neo4j Desktop API semi-violates its own
                        // contract, doesn't know the password, and so fails to pass it
                        // to halin.
                        throw new Error(`No password received from Neo4j Desktop.
                        Please check that the option "Store Database Passwords" is
                        enabled in Neo4j Desktop`);
                    }

                    // Create a default driver to have around.
                    this.base.driver = this.driverFor(this.getBaseURI());

                    // sentry.fine('HalinContext created', this);
                    return Promise.all([
                        this.checkUser(this.base.driver, progressCallback),
                        this.memberSet.initialize(this, this.base.driver, progressCallback),
                    ]);
                })
                // Checking databases must be after checking for a cluster, since we need to know who leader is
                .then(() => this.dbSet.initialize(this))
                .then(() => {
                    this.getClusterManager().addEvent({
                        type: 'halin',
                        message: 'Halin monitoring started',
                        address: 'all members',
                    });
                    report('Initialization complete');
                    return this;
                });
        } catch (e) {
            sentry.reportError(e, 'General Halin Context Error');
            try { this.shutdown(); }
            catch (err) {
                sentry.reportError(err, 'Failure to shut down post halin context error');
            }
            return Promise.reject(new Error('General Halin Context error', e));
        }
    }
}