import Parser from 'uri-parser';
import sentry from '../sentry/index';
import _ from 'lodash';
import math from 'mathjs';

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
        this.role = record.get('role');
        this.database = record.get('database');
        this.dbms = {};
        this.driver = null;
        this.observations = [];
        this.errors = {};
    }

    /**
     * Set the default driver to use for the cluster node instance
     */
    setDriver(driver) {
        this.driver = driver;
    }

    performance() {
        return {
            stdev: math.std(...this.observations),
            mean: math.mean(...this.observations),
            median: math.median(...this.observations),
            mode: math.mode(...this.observations),
            min: math.min(...this.observations),
            max: math.max(...this.observations),
            errors: this.errors,
            observations: this.observations,
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

    /**
     * Returns true if the context provides for native auth management, false otherwise.
     */
    supportsNativeAuth() {
        return this.dbms.nativeAuth;
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
                sentry.reportError(err, 'Failed to get DBMS components');
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
                sentry.reportError(err, 'Failed to get DBMS auth implementation type');
                this.dbms.nativeAuth = false;
            });

        return Promise.all([componentsPromise, authPromise])
            .then(whatever => {
                if (this.isCommunity()) {
                    // #operability As a special exception, community will fail 
                    // the test to determine if a node supports native auth -- but it
                    // does.  It fails because community doesn't have the concept of
                    // auth providers.
                    this.dbms.nativeAuth = true;
                }

                return whatever;
            })
    }

    _txSuccess(time) {
        this.observations.push(time);

        // Truncate to last max set, to prevent it growing without bound.
        if (this.observations.length > MAX_OBSERVATIONS) {
            this.observations = this.observations.slice(this.observations.length - MAX_OBSERVATIONS, this.observations.length);
        }
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