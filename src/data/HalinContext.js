import nd from '../neo4jDesktop/index';
import ClusterNode from '../data/ClusterNode';
import _ from 'lodash';
import Promise from 'bluebird';
import uuid from 'uuid';

const neo4j = require('neo4j-driver/lib/browser/neo4j-web.min.js').v1;

export default class HalinContext {
    constructor() {
        this.project = null;
        this.graph = null;
        this.drivers = {};
    }

    /**
     * Create a new driver for a given address.
     */
    driverFor(addr, username=_.get(this.base, 'username'), password=_.get(this.base, 'password')) {
        if (this.drivers[addr]) {
            return this.drivers[addr];
        }

        const driver = neo4j.driver(addr, neo4j.auth.basic(username, password), {
            encrypted: true,
        });
        this.drivers[addr] = driver;
        return driver;
    }

    shutdown() {
        console.log('Shutting down halin context');
        Object.values(this.drivers).map(driver => driver.close());
    }

    isCluster() {
        // Must have more than one node
        return this.clusterNodes && this.clusterNodes.length > 1;
    }

    checkForCluster(activeDb) {
        const session = this.base.driver.session();
        console.log('activeDb', activeDb);
        return session.run('CALL dbms.cluster.overview()', {})
            .then(results => {
                this.clusterNodes = results.records.map(rec => new ClusterNode(rec))

                this.clusterNodes.forEach(node => {
                    console.log(node.getAddress());
                });
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
                    throw err;
                }
            })
            .finally(() => session.close());
    }

    /**
     * Returns a promise that resolves to the HalinContext object completed,
     * or rejects.
     */
    initialize() {
        try {
            return nd.getFirstActive()
                .then(active => {
                    this.project = active.project;
                    this.graph = active.graph;

                    this.base = _.cloneDeep(active.graph.connection.configuration.protocols.bolt);

                    // Create a default driver to have around.
                    const uri = `bolt://${this.base.host}:${this.base.port}`;
                    this.base.driver = this.driverFor(uri);

                    console.log('HalinContext created', this);
                    return this.checkForCluster(active);
                })
                .then(() => this)
        } catch (e) {
            return Promise.reject(new Error('General Halin Context error', e));
        }
    }

    runDiagnostics() {
        const data = [
            { node: 'foo', domain: 'bar', key: 'baz', value: 'quux' },            
        ];

        return Promise.resolve(data);
    }
}