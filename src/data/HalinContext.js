import nd from '../neo4jDesktop/index';
import ClusterNode from '../data/ClusterNode';
import _ from 'lodash';
import Promise from 'bluebird';
import uuid from 'uuid';
import moment from 'moment';
import appPkg from '../package.json';

const neo4j = require('neo4j-driver/lib/browser/neo4j-web.min.js').v1;

export default class HalinContext {
    domain = 'halin';

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

    _nodeDiagnostics(clusterNode) {
        const node = clusterNode.getAddress();
        const mkEntry = (domain, key, value) =>
            _.merge({ node }, { domain, key, value });

        const basics = [
            mkEntry(this.domain, 'protocols', clusterNode.protocols()),
            mkEntry(this.domain, 'role', clusterNode.role),
            mkEntry(this.domain, 'database', clusterNode.database),
            mkEntry(this.domain, 'id', clusterNode.id),
        ];

        const session = this.driverFor(clusterNode.getBoltAddress()).session();

        // Query must return 'value'
        const noFailCheck = (domain, query, key) =>
            session.run(query, {})
                .then(results => results.records[0])
                .then(record => record.get('value'))
                .catch(err => err)  // Convert errors into the value.
                .then(value => {
                    const obj = {};
                    obj[domain] = {};
                    obj[domain][key] = value;
                    return obj;
                });

        // Format all JMX data into records.
        // Put the whole thing into an object keyed on jmx.
        const genJMX = session.run("CALL dbms.queryJmx('*:*')", {})
            .then(results => 
                results.records.map(rec => ({
                    name: rec.get('name'),
                    attributes: rec.get('attributes'),
                })))
            .then(array => ({ JMX: array }))

        // Format node config into records.
        const genConfig = session.run('CALL dbms.listConfig()', {})
            .then(results =>
                results.records.map(rec => ({
                    name: rec.get('name'), value: rec.get('value'),
                })))
            .then(allConfig => ({ configuration: allConfig }));

        const constraints = session.run('CALL db.constraints()', {})
            .then(results =>
                results.records.map((rec, idx) => ({ idx, description: rec.get('description') })))
            .then(allConstraints => ({ constraints: allConstraints }));

        const indexes = session.run('CALL db.indexes()', {})
            .then(results =>
                results.records.map((rec, idx) => ({
                    description: rec.get('description'),
                    label: rec.get('label'),
                    properties: rec.get('properties'),
                    state: rec.get('state'),
                    type: rec.get('type'),
                    provider: rec.get('provider'),
                })))
            .then(allIndexes => ({ indexes: allIndexes }));

        const otherPromises = [
            noFailCheck('algo', 'RETURN algo.version() as value', 'version'),
            noFailCheck('apoc', 'RETURN apoc.version() as value', 'version'),
            noFailCheck('nodes', 'MATCH (n) RETURN count(n) as value', 'count'),
            noFailCheck('schema', 'call db.labels() yield label return collect(label) as value', 'labels'),
        ];

        return Promise.all([indexes, constraints, genJMX, genConfig, ...otherPromises])
            .then(arrayOfDiagnosticObjects => _.merge(...arrayOfDiagnosticObjects))
            .finally(() => session.close());
    }

    _halinDiagnostics() {
        const halin = {
            drivers: Object.keys(this.drivers).map(uri => ({
                domain: `${this.domain}-driver`,
                node: uri, 
                key: 'encrypted',
                value: _.get(this.drivers[uri]._config, 'encrypted'),
            })),
            diagnosticsGenerated: moment.utc().toISOString(),
            version: appPkg.version,
        };

        return Promise.resolve(halin);
    }

    runDiagnostics() {
        const diagnostics = {};

        const allNodeDiags = Promise.all(this.clusterNodes.map(clusterNode => this._nodeDiagnostics(clusterNode)))
            .then(nodeDiagnostics => ({ clusterNodes: nodeDiagnostics }));
        
        const halinDiags = this._halinDiagnostics();

        // Each object resolves to a diagnostic object with 1 key, and sub properties.
        // All diagnostics are just a merge of those objects.
        return Promise.all([halinDiags, allNodeDiags])
            .then(arrayOfObjects => _.merge(...arrayOfObjects))
    }
}