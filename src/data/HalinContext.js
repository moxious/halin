import nd from '../neo4jDesktop/index';
import ClusterNode from '../data/ClusterNode';
import _ from 'lodash';

const neo4j = require('neo4j-driver/lib/browser/neo4j-web.min.js').v1;

export default class HalinContext {
    constructor() {
        this.initialize();
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

        const driver = neo4j.driver(addr, neo4j.auth.basic(username, password));
        this.drivers[addr] = driver;
        return driver;
    }

    checkForCluster() {
        const session = this.base.driver.session();

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
                    // Not a cluster, this isn't an error.
                } else {
                    throw err;
                }
            })
            .finally(() => session.close());
    }

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
                    // return this.checkForCluster();
                })
                .catch(err => {
                    console.error('Error initializing Halin Context', err);
                })
        } catch (e) {
            console.error('General Halin Context error', e);
        }
    }
}