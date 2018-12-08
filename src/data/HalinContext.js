import nd from '../neo4jDesktop/index';
import ClusterNode from '../data/ClusterNode';
import DataFeed from '../data/DataFeed';
import _ from 'lodash';
import Promise from 'bluebird';
import uuid from 'uuid';
import moment from 'moment';
import appPkg from '../package.json';
import ClusterManager from './cluster/ClusterManager';
import queryLibrary from '../data/query-library';
import * as Sentry from '@sentry/browser';
import neo4j from '../driver';

/**
 * HalinContext is a controller object that keeps track of state and permits diagnostic
 * reporting.
 * 
 * It creates its own drivers and does not use the Neo4j Desktop API provided drivers.
 * The main app will attach it to the window object as a global.
 */
export default class HalinContext {
    domain = 'halin';

    constructor() {
        this.project = null;
        this.graph = null;
        this.drivers = {};
        this.dataFeeds = {};
        this.pollRate = 1000;
        this.driverOptions = {
            connectionTimeout: 10000,
            trust: 'TRUST_CUSTOM_CA_SIGNED_CERTIFICATES',
        };
        this.debug = false;
        this.mgr = new ClusterManager(this);
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

    getFeedsFor(clusterNode) {
        return _.values(this.dataFeeds).filter(df => df.node === clusterNode);
    }

    getDataFeed(feedOptions) {
        const df = new DataFeed(feedOptions);
        const feed = this.dataFeeds[df.name];
        if (feed) {
            return feed;
        }
        this.dataFeeds[df.name] = df;
        // console.log('Halin starting new DataFeed: ', df.name.slice(0, 120) + '...');
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
            console.log('Driver connection', { addr, username, allOptions });
        }
        const driver = neo4j.driver(addr,
            neo4j.auth.basic(username, password), allOptions);

        this.drivers[addr] = driver;
        return driver;
    }

    shutdown() {
        console.log('Shutting down halin context');
        _.values(this.dataFeeds).map(df => df.stop);
        _.values(this.drivers).map(driver => driver.close());
    }

    /**
     * Returns true if the context is attached to a Neo4j Enterprise Edition server
     * with more than one cluster node.
     */
    isCluster() {
        // Must have more than one node
        return this.clusterNodes && this.clusterNodes.length > 1;
    }

    /**
     * Returns true if the context is attached to a Neo4j Enterprise edition server,
     * false otherwise.
     */
    isEnterprise() {
        return this.clusterNodes[0].isEnterprise();
    }

    /**
     * Returns true if the context provides for native auth management, false otherwise.
     */
    supportsNativeAuth() {
        return this.clusterNodes[0].supportsNativeAuth();
    }

    /**
     * Starts a slow data feed for the node's cluster role.  In this way, if the leader
     * changes, we can detect it.
     */
    watchForClusterRoleChange(clusterNode) {
        const roleFeed = this.getDataFeed(_.merge({
            node: clusterNode,
            driver: this.driverFor(clusterNode.getBoltAddress()),
        }, queryLibrary.CLUSTER_ROLE));

        const addr = clusterNode.getBoltAddress();
        const onRoleData = (newData, dataFeed) => {
            const newRole = newData.data[0].role;

            // Something in cluster topology just changed...
            if (newRole !== clusterNode.role) {
                const oldRole = clusterNode.role;
                clusterNode.role = newRole;

                this.getClusterManager().addEvent({
                    date: new Date(),
                    message: `Role change from ${oldRole} to ${newRole}`,
                    address: clusterNode.getBoltAddress(),
                });
            }
        };

        const onError = (err, dataFeed) => {
            Sentry.captureException(err);
            console.error('HalinContext: failed to get cluster role for ', addr, err);
        };

        roleFeed.addListener(onRoleData);
        roleFeed.onError = onError;
        return roleFeed;
    }

    checkForCluster(activeDb) {
        const session = this.base.driver.session();
        // console.log('activeDb', activeDb);
        return session.run('CALL dbms.cluster.overview()', {})
            .then(results => {
                this.clusterNodes = results.records.map(rec => new ClusterNode(rec))

                return this.clusterNodes.map(clusterNode => this.watchForClusterRoleChange(clusterNode));
            })
            .catch(err => {
                const str = `${err}`;
                if (str.indexOf('no procedure') > -1) {
                    // Halin will look at single node databases
                    // running in desktop as clusters of size 1.
                    const rec = {
                        id: uuid.v4(),
                        addresses: nd.getAddressesForGraph(activeDb.graph),
                        role: 'SINGLE',
                        database: 'default',
                    };

                    // Psuedo object behaves like a cypher result record.
                    // Somewhere, a strong typing enthusiast is screaming. ;)
                    const get = key => rec[key];
                    rec.get = get;

                    this.clusterNodes = [new ClusterNode(rec)];
                } else {
                    Sentry.captureException(err);
                    throw err;
                }
            })
            .then(() => Promise.all(this.clusterNodes.map(cn => {
                const driver = this.driverFor(cn.getBoltAddress());
                return cn.checkComponents(driver);
            })))
            .then(() => 
                Promise.all(this.clusterNodes.map(cn => this.ping(cn))))
            .finally(() => session.close());
    }

    getCurrentUser() {
        return this.currentUser;
    }

    checkUser(driver) {
        const q = 'call dbms.showCurrentUser()';
        const session = driver.session();

        return session.run(q, {})
            .then(results => {
                const rec = results.records[0];

                let roles = [];
                try {
                    // Community doesn't expose this field, and
                    // it's an ignorable error
                    roles = rec.get('roles');
                } catch (e) { ; }

                this.currentUser = {
                    username: rec.get('username'),
                    roles,
                    flags: rec.get('flags'),
                };
                
                // console.log('Current User', this.currentUser);
            })
            .catch(err => {
                Sentry.captureException(err);
                console.error('Failed to get user info');
                this.currentUser = {
                    username: 'UNKNOWN',
                    roles: [],
                    flags: [],
                };
            })
            .finally(() => session.close());
    }

    static getProjectFromEnvironment() {
        return {
            name: process.env.GRAPH_NAME || 'environment',
            graphs: [
                HalinContext.getGraphFromEnvironment(),
            ],
        };
    }

    static getGraphFromEnvironment() {
        const encryption = process.env.ENCRYPTION_REQUIRED ? 'REQUIRED' : 'OPTIONAL';
        const host = process.env.NEO4J_HOST || 'localhost';
        const port = process.env.NEO4J_PORT || 7687;
        const username = process.env.NEO4J_USERNAME || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'admin';

        return {
            name: process.env.GRAPH_NAME || 'environment',
            status: process.env.GRAPH_STATUS || 'ACTIVE',
            databaseStatus: process.env.DATABASE_STATUS || 'RUNNING',
            databaseType: process.env.DATABASE_TYPE || 'neo4j',
            id: process.env.DATABASE_UUID || uuid.v4(),
            connection: {
                configuration: {
                    path: '.',
                    protocols: {
                        bolt: {
                            host,
                            port,
                            username,
                            password,
                            enabled: true,
                            tlsLevel: encryption,
                        },
                    },
                },
            },
        };
    }

    /**
     * Returns a promise that resolves to the HalinContext object completed,
     * or rejects.
     * 
     * There are three major code paths here:
     * (1) Running in Neo4j desktop, use that API to figure what graph to 
     * connect to.
     * (2) Running in browser (not desktop) -- in which case we needed to
     * fake the neo4j desktop API facade prior to this step
     * (3) Running in terminal (and window object isn't even defined)
     */
    initialize() {
        let inBrowser = true;
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
                // No need to fake a neo4jdesktop API.  Construct
                // needed context directly from env vars.
                getGraphSpecificsPromise = Promise.resolve({
                    project: HalinContext.getProjectFromEnvironment(),
                    graph: HalinContext.getGraphFromEnvironment(),
                });
            } else {
                getGraphSpecificsPromise = nd.getFirstActive();
            }

            return getGraphSpecificsPromise.then(active => {
                    if (_.isNil(active)) {
                        // In the web version, this will never happen because the
                        // shim will fake an active DB.  In Neo4j Desktop this 
                        // **will** happen if the user launches Halin without an 
                        // activated database.
                        throw new Error('In order to launch Halin, you must have an active database connection');
                    }

                    // console.log('FIRST ACTIVE', active);
                    this.project = active.project;
                    this.graph = active.graph;

                    this.base = _.cloneDeep(active.graph.connection.configuration.protocols.bolt);

                    // Create a default driver to have around.
                    const uri = `bolt://${this.base.host}:${this.base.port}`;
                    this.base.driver = this.driverFor(uri);

                    // console.log('HalinContext created', this);
                    return Promise.all([
                        this.checkUser(this.base.driver),
                        this.checkForCluster(active),
                    ]);
                })
                .then(() => this)
        } catch (e) {
            console.error(e);
            return Promise.reject(new Error('General Halin Context error', e));
        }
    }

    /**
     * Ping a cluster node with a trivial query, just to keep connections
     * alive and verify it's still listening.  This forces driver creation
     * for a node if it hasn't already happened.
     * @param {ClusterNode} the node to ping
     * @returns {Promise} that resolves to an object with an elapsedMs field
     * or an err field populated.
     */
    ping(clusterNode) {
        const addr = clusterNode.getBoltAddress();
        const driver = this.driverFor(addr);

        // Gets or creates a ping data feed for this cluster node.
        // Data feed keeps running so that we can deliver the data to the user,
        // but also have a feed of data to know if the cord is getting unplugged
        // as the app runs.
        const pingFeed = this.getDataFeed(_.merge({
            node: clusterNode,
            driver,
        }, queryLibrary.PING));

        // Caller needs a promise.  The feed is already running, so 
        // We return a promise that resolves the next time the data feed
        // comes back with a result.
        return new Promise((resolve, reject) => {
            const onPingData = (newData, dataFeed) => {
                return resolve({
                    clusterNode,
                    elapsedMs: _.get(newData, 'data[0]_sampleTime'),
                    newData,
                    err: null,
                });
            };

            const onError = (err, dataFeed) => {
                console.error('HalinContext: failed to ping', addr, err);
                reject(err, dataFeed);
            };

            pingFeed.addListener(onPingData);
            pingFeed.onError = onError;
        });
    }
}