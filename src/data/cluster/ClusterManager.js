import _ from 'lodash';
import Promise from 'bluebird';

/**
 * This is a controller for clusters.
 * 
 * Beware, by "Clusters" here we mean any number of neo4j nodes.
 * A standalone single instance on desktop is here thought of as
 * a cluster of 1.
 * 
 * This class exists to coordinate administrative actions that
 * should be inherently cross-cluster.
 * 
 * For example, if you wanted to make a dynamic config change,
 * add a user, and so on.
 */
const clusterOpSuccess = (node, results) => ({
    success: true, node, addr: node.getBoltAddress(), results
});

const clusterOpFailure = (node, err) => ({
    success: false, node, addr: node.getBoltAddress(), err
});

export default class ClusterManager {
    constructor(halinCtx) {
        this.ctx = halinCtx;
    }

    /**
     * Map a query across all cluster members in parallel.
     * 
     * @param query the cypher query
     * @param params cypher query params.
     * 
     * @return {Promise} of an object with { success, results }.
     * Success is true only if all underlying queries succeeded.
     * Results is an array of result objects from each individual
     * query.  
     */
    mapQueryAcrossCluster(query, params) {
        const promises = this.ctx.clusterNodes.map(node => {
            const addr = node.getBoltAddress();
            const driver = this.ctx.driverFor(addr);

            const session = driver.session();

            // Guarantee that promise resolves.
            // it resolves to an object that indicates success
            // or failure.
            return session.run(query, params)
                .then(results => clusterOpSuccess(node, results))
                .catch(err => clusterOpFailure(node, err))
                .finally(() => session.close());
        });

        return Promise.all(promises)
            .then(results => {
                // Overall we're a success only if all underlying promises
                // were.  Otherwise we failed.
                const success = 
                    results.filter(r => r.success).length === results.length;

                // Incude results so that we can see individual
                // operation failures if appropriate.
                return { success, results };
            });
    }

    addUser(user) {
        const { username, password } = user;
        if (!user || !password) {
            throw new Error('Call with object containing keys username, password');
        }

        return this.mapQueryAcrossCluster(
            'CALL dbms.security.createUser({username}, {password})',
            { username, password }
        );
    } 

    addRole(role) {
        if (!role) { throw new Error('Must provide role'); }

        return this.mapQueryAcrossCluster(
            'CALL dbms.security.createRole({role})',
            { role }
        );
    }

    /** Specific to a particular node */
    addNodeRole(driver, username, role) {
        const session = driver.session();

        return session.run('call dbms.security.addRoleToUser({role}, {username})', { username, role })
            .finally(() => session.close());
    }

    /** Specific to a particular node */
    removeNodeRole(driver, username, role) {
        const session = driver.session();

        return session.run('call dbms.security.removeRoleFromUser({role}, {username})', { username, role })
            .finally(() => session.close());
    }

    /**
     * @param {Object} user 
     * @param {Array} roles 
     * @returns {Promise} that resolves to a clusterOp result
     */
    associateUserToRoles(user, roles) {
        if (!_.isArray(roles)) { 
            throw new Error('roles must be an array');
        } if (!_.isObject(user) || !user.username || !user.roles) {
            throw new Error('user must be an object with username');
        }

        const username = user.username;

        // Strategy:
        // For each cluster node:
        //   (1) Gather roles that user has.
        //   (2) Determine differences
        //   (3) Apply changes.
        // 
        // Lots of ways for this to fail.
        //   (a) user doesn't exist on that node
        //   (b) role doesn't exist on that node
        //   (c) Underlying association query fails.
        const gatherRoles = (node, driver, session) => {
            return session.run('CALL dbms.security.listRolesForUser({username})',
                {username})
                .then(results => 
                    results.records.map(r => r.get('value')));
        };

        const determineDifferences = (rolesHere, node, driver, session) => {
            const oldRoles = new Set(...rolesHere);
            const newRoles = new Set(...roles);
            const toDelete = new Set(
                [...oldRoles].filter(x => !newRoles.has(x))
            );
            const toAdd = new Set(
                [...newRoles].filter(x => !oldRoles.has(x))
            );
            // The roles they already have, which user wants to preserve (set intersection)
            const toPreserve = new Set(
                [...oldRoles].filter(x => newRoles.has(x))
            );
    
            console.log('Role modification: ', 
                node.getBoltAddress(), 'adding', 
                toAdd, 
                'removing', toDelete, 
                'preserving', toPreserve);
            return { toAdd, toDelete, toPreserve };
        };

        const applyChanges = (roleChanges, node, driver) => {
            const { toAdd, toDelete } = roleChanges;

            const addPromises = [...toAdd].map(role => this.addNodeRole(driver, username, role));
            const delPromises = [...toDelete].map(role => this.removeNodeRole(driver, username, role));

            const allRolePromises = 
                addPromises.concat(delPromises);

            // TODO -- not wrapped in a TX.  It's possible for adding some roles to fail, others
            // to succeed.
            return Promise.all(allRolePromises)
                .then(() => {
                    const added = [...toAdd].join(', ');
                    const removed = [...toDelete].join(', ');

                    const addedStr = added ? 'Added: ' + added : '';
                    const removedStr = removed ? 'Removed: ' + removed : '';

                    const results = `Assigned roles to ${username}. ${addedStr} ${removedStr}`;
                    return clusterOpSuccess(node, results);
                })
                .catch(err => clusterOpFailure(node, err));
        };

        this.ctx.clusterNodes.map(node => {
            const addr = node.getBoltAddress();
            const driver = this.ctx.driverFor(addr);

            const s = driver.session();

            return gatherRoles(node, driver, s)
                .then(rolesHere => determineDifferences(rolesHere, node, driver, s))
                .then(roleChanges => applyChanges(roleChanges, node, driver, s))
                .then(() => clusterOpSuccess(node))
                .catch(err => clusterOpFailure(node, err))
                .finally(() => s.close());
        });
    }
}