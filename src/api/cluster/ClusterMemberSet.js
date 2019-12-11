import _ from 'lodash';
import queryLibrary from '../data/queries/query-library';
import ClusterMember from './ClusterMember';
import errors from '../driver/errors';
import sentry from '../sentry';
import uuid from 'uuid';

/**
 * This class is a wrapper for a set of ClusterMember objects, and handles housekeeping
 * about keeping them up to date with the evolving cluster state.
 * #operability Neo4j doesn't really expose a "Cluster" abstraction, so this is a part of
 * the abstraction that Halin puts on top to make all of this possible.
 */
export default class ClusterMemberSet {
    constructor() {
        this.clusterMembers = [];
    }

    members() { return this.clusterMembers; }

    shutdown() {
        return Promise.all(this.clusterMembers.map(member => member.shutdown()))
            .catch(err => sentry.reportError(err, 'Failure to shut down cluster members', err));
    }

    initialize(halin, driver, progressCallback) {
        const session = driver.session();

        const report = str => progressCallback ? progressCallback(str) : null;

        report('Checking cluster status');
        return session.run(queryLibrary.CLUSTER_OVERVIEW.query)
            .then(results => {
                console.log('RESULTS',results);
                this.clusterMembers = results.records.map(rec => new ClusterMember(rec));

                // Note that in the case of community or mode=SINGLE, because the cluster overview fails,
                // this will never take place.  Watching for cluster role changes doesn't apply in those cases.
                return this.clusterMembers.map(clusterMember => {
                    const driver = halin.driverFor(clusterMember.getBoltAddress());
                    clusterMember.setDriver(driver);
                    return report(`Member ${clusterMember.getLabel()} initialized`);
                });
            })
            .catch(err => {
                if (errors.noProcedure(err)) {
                    // Halin will look at single node databases
                    // running in desktop as clusters of size 1.
                    // #operability I wish Neo4j treated mode=SINGLE as a cluster of 1 and exposed dbms.cluster.*
                    const base = halin.getBaseDetails();

                    const host = base.host;
                    const port = base.port;
                    const addresses = [`bolt://${host}:${port}`];

                    const rec = {
                        id: uuid.v4(),
                        addresses,
                        role: 'SINGLE',
                        database: 'default',
                    };

                    this.clusterMembers = [ClusterMember.makeStandalone(halin, rec)];
                } else {
                    sentry.reportError(err);
                    throw err;
                }
            })
            .then(() => report('Verifying connectivity with members...'))
            .then(() => {
                console.log('At this point members are ', this.members());
            })
            .then(() => 
                Promise.all(this.members().map(member => this.ping(halin, member))))
            .then(() => report('Checking components/features for each cluster member...'))
            .then(() => Promise.all(this.members().map(member => member.checkComponents())))
            .then(() => Promise.all(this.members().map(member => this.watchForClusterRoleChange(member))))
            .finally(() => session.close());
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
                sentry.error('ClusterMemberSet: failed to ping', addr, err);
                reject(err, dataFeed);
            };

            pingFeed.addListener(onPingData);
            pingFeed.onError = onError;
        });
    }

    /**
     * Starts a slow data feed for the node's cluster role.  In this way, if the leader
     * changes, we can detect it.
     */
    watchForClusterRoleChange(clusterMember) {
        console.log('watchForClusterRoleChange TBD');

        return Promise.resolve(true);
        // TODO

        // const roleFeed = this.getDataFeed(_.merge({
        //     node: clusterMember,
        // }, queryLibrary.CLUSTER_ROLE));

        // const addr = clusterMember.getBoltAddress();
        // const onRoleData = (newData /* , dataFeed */) => {
        //     const newRole = newData.data[0].role;

        //     // Something in cluster topology just changed...
        //     if (newRole !== clusterMember.role) {
        //         const oldRole = clusterMember.role;
        //         clusterMember.role = newRole;

        //         const event = {
        //             message: `Role change from ${oldRole} to ${newRole}`,
        //             type: 'rolechange',
        //             address: clusterMember.getBoltAddress(),
        //             payload: {
        //                 old: oldRole,
        //                 new: newRole,
        //             },
        //         };

        //         this.getClusterManager().addEvent(event);
        //     }
        // };

        // const onError = (err /*, dataFeed */) =>
        //     sentry.reportError(err, `HalinContext: failed to get cluster role for ${addr}`);

        // roleFeed.addListener(onRoleData);
        // roleFeed.onError = onError;
        // return roleFeed;
    }
}