import _ from 'lodash';
import queryLibrary from '../data/queries/query-library';
import ClusterMember from './ClusterMember';
import errors from '../driver/errors';
import sentry from '../sentry';
import uuid from 'uuid';

const REFRESH_INTERVAL = 5000;

/**
 * This class is a wrapper for a set of ClusterMember objects, and handles housekeeping
 * about keeping them up to date with the evolving cluster state.
 * #operability Neo4j doesn't really expose a "Cluster" abstraction, so this is a part of
 * the abstraction that Halin puts on top to make all of this possible.
 */
export default class ClusterMemberSet {
    constructor() {
        this.clusterMembers = [];
        this.clustered = false;
        this.timeout = null;
    }

    members() { return this.clusterMembers; }

    shutdown() {
        if (this.timeout) { clearTimeout(this.timeout); }

        return Promise.all(this.clusterMembers.map(member => member.shutdown()))
            .catch(err => sentry.reportError(err, 'Failure to shut down cluster members', err));
    }

    initialize(halin, driver, report = (msg) => console.log(msg)) {
        const session = driver.session();

        report('Checking cluster status');
        return session.run(queryLibrary.CLUSTER_OVERVIEW.query)
            .then(results => {
                this.clustered = true;
                return this._mergeChanges(halin, results.records.map(rec => new ClusterMember(rec)), report);
            })
            .catch(err => {
                if (errors.noProcedure(err)) {
                    // Halin will look at single node databases
                    // running in desktop as clusters of size 1.
                    // #operability I wish Neo4j treated mode=SINGLE as a cluster of 1 and exposed dbms.cluster.*
                    const base = halin.getBaseDetails();

                    this.clustered = false;

                    const host = base.host;
                    const port = base.port;
                    const addresses = [`bolt://${host}:${port}`];

                    const rec = {
                        id: uuid.v4(),
                        addresses,
                        role: 'SINGLE',
                        database: 'default',
                    };

                    return this._mergeChanges(halin, [ClusterMember.makeStandalone(halin, rec)]);
                } else {
                    sentry.reportError(err);
                    throw err;
                }
            })
            .then(() => this.scheduleRefresh(halin))
            .finally(() => session.close());
    }

    scheduleRefresh(halin) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // You don't need to refresh non-clustered databases there's only one member to talk to.
        if (!this.clustered) {
            return false;
        }

        this.timeout = setTimeout(() => this.refresh(halin), REFRESH_INTERVAL);
        return this.timeout;
    }

    /**
     * Ping a cluster node with a trivial query, just to keep connections
     * alive and verify it's still listening.  This forces driver creation
     * for a node if it hasn't already happened.
     * @param {ClusterMember} the node to ping
     * @returns {Promise} that resolves to an object with an elapsedMs field
     * or an err field populated.
     */
    ping(halin, clusterMember) {
        const addr = clusterMember.getBoltAddress();

        // Gets or creates a ping data feed for this cluster node.
        // Data feed keeps running so that we can deliver the data to the user,
        // but also have a feed of data to know if the cord is getting unplugged
        // as the app runs.
        const pingFeed = halin.getDataFeed(_.merge({
            node: clusterMember,
        }, queryLibrary.PING));

        // Caller needs a promise.  The feed is already running, so 
        // We return a promise that resolves the next time the data feed
        // comes back with a result.
        return new Promise((resolve, reject) => {
            const onPingData = (newData /* , dataFeed */) => {
                return resolve({
                    clusterMember: clusterMember,
                    elapsedMs: _.get(newData, 'data[0]_sampleTime'),
                    newData,
                    err: null,
                });
            };

            const onError = (err, dataFeed) => {
                sentry.fine('ClusterMemberSet: failed to ping', addr, err);
                reject(err, dataFeed);
            };

            pingFeed.addListener(onPingData);
            pingFeed.onError = onError;
        });
    }

    remove(member) {
        let idx = -1;

        for(let i=0; i<this.clusterMembers.length; i++) {
            if (this.clusterMembers[i].getId() === member.getId()) {
                idx = i;
                break;
            }
        }

        if (idx > -1) {
            this.clusterMembers.splice(idx, 1);
        }

        return idx > -1;
    }

    /**
     * PRIVATE takes a new set of cluster members from a refresh, and merges those changes into
     * the current set.  We do not replace the current set with the new set, because the current set
     * has other state information (such as observations) we've accumulated about it.
     * @param {Array<ClusterMember>} newSet 
     */
    _mergeChanges(halin, newSet, report = () => null) {
        // sentry.fine('MERGE CHANGES', newSet);
        const lookup = (id, set) => set.filter(m => m.getId() === id)[0];

        const currentSet = new Set(this.members().map(m => m.getId()));
        const candidateSet = new Set(newSet.map(m => m.getId()));

        const exitingMembers = new Set([...currentSet].filter(id => !candidateSet.has(id)));
        const enteringMembers = new Set([...candidateSet].filter(id => !currentSet.has(id)));
        const changingMembers = new Set([...currentSet].filter(id => candidateSet.has(id)));

        const promises = [];
        const payload = m => ({ address: m.getBoltAddress(), database: m.getDatabaseRoles() });

        const events = [];

        exitingMembers.forEach(exitingId => {
            const member = lookup(exitingId, this.members());

            events.push({
                message: `Cluster member exited.`,
                type: 'exit',
                address: member.getBoltAddress(),
                payload: payload(member),
            });

            this.remove(member);
        });

        enteringMembers.forEach(enteringId => {
            const member = lookup(enteringId, newSet);

            // SETUP ACTIONS FOR ANY NEW MEMBER
            const driver = halin.driverFor(member.getBoltAddress());
            member.setDriver(driver);
            const setup = this.ping(halin, member)
                .then(() => member.checkComponents());

            promises.push(setup);
            
            events.push({
                message: `Cluster member entered.`,
                type: 'enter',
                address: member.getBoltAddress(),
                payload: payload(member),
            })

            this.clusterMembers.push(member);
        });

        changingMembers.forEach(changingId => {
            const member = lookup(changingId, this.members());
            const changes = lookup(changingId, newSet);

            if (member.merge(changes)) {
                events.push({
                    message: `Cluster member changed database assignments, groups, or addresses.`,
                    type: 'change',
                    address: member.getBoltAddress(),
                    payload: payload(member),
                });
            }
        });

        // Fire events at the end so listeners see any data structure changes
        events.forEach(event => halin.getClusterManager().addEvent(event));

        return promises.length > 0 ? Promise.all(promises) : Promise.resolve(true);
    }

    refresh(halin) {
        // sentry.fine('Refreshing cluster member set');
        return halin.getSystemDBWriter().run(queryLibrary.CLUSTER_OVERVIEW.query)
            .then(results => this._mergeChanges(halin, results.records.map(r => new ClusterMember(r))))
            .then(() => this.scheduleRefresh(halin))
            .catch(err => {
                sentry.error('Error refreshing cluster member set', err);
            });
    }
}