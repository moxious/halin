import _ from 'lodash';
import Promise from 'bluebird';
import sentry from '../sentry/index';
import moment from 'moment';
import uuid from 'uuid';
import Ring from 'ringjs';
import neo4j from '../driver/index';
import ql from '../data/queries/query-library';
import Database from '../Database';

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
 * 
 * This is complicated by issue #72, neo4j system graph support.
 * Prior to the system graph, some administrative queries need
 * to be mapped across the entire cluster to hold for all members.
 * Neo4j's which support the system graph dont' have this limitation,
 * so we need to be able to detect and do the right thing.
 */
const clusterOpSuccess = (node, results) => ({
    success: true, node, addr: node.getBoltAddress(), results,
});

const clusterOpFailure = (node, err) => {
    if (err) { sentry.reportError(err); }
    return {
        success: false, node, addr: node.getBoltAddress(), err,
    };
};

const packageClusterOpResults = results => {
    // Overall we're a success only if all underlying promises
    // were.  Otherwise we failed.
    const success =
        results.filter(r => r.success).length === results.length;

    // Incude results so that we can see individual
    // operation failures if appropriate.
    return { success, results };
};

const MAX_EVENTS = 200;

export default class ClusterManager {
    constructor(halinCtx) {
        this.ctx = halinCtx;
        this.eventLog = new Ring(MAX_EVENTS);
        this.listeners = [];
    }

    addListener(listener) {
        if (this.listeners.indexOf(listener) === -1) {
            this.listeners.push(listener);
        }

        return this.listeners;
    }

    removeListener(listener) {
        const idx = this.listeners.indexOf(listener);
        if (idx > -1) {
            this.listeners.splice(idx, 1);
        }

        return this.listeners;
    }

    addEvent(event) {
        if (!event.message || !event.type) {
            throw new Error('ClusterManager events must have at least message, type');
        }

        // Don't modify caller's argument.
        const data = _.cloneDeep(event);
        _.set(data, 'date', moment.utc().toISOString());
        _.set(data, 'payload', event.payload || null);
        _.set(data, 'id', uuid.v4());
        this.eventLog.push(data);

        // Notify listeners.
        this.listeners.forEach(f => f(event));
        return event;
    }

    getEventLog() {
        return this.eventLog.toArray();
    }

    /**
     * Cluster Wide Query.
     * 
     * For non-system-graph supporting Neo4js, this 
     * maps a query across all cluster members in parallel.
     * 
     * For system-graph supporting Neo4js, this is equivalent
     * to running the query against the leader of the cluster.
     * See https://github.com/moxious/halin/issues/72
     * 
     * @param query the cypher query
     * @param params cypher query params.
     * 
     * @return {Promise} of an object with { success, results }.
     * Success is true only if all underlying queries succeeded.
     * Results is an array of result objects from each individual
     * query.  
     */
    clusterWideQuery(query, params) {
        const membersToRunAgainst = this.ctx.supportsSystemGraph() ?
            [this.ctx.getWriteMember()] :
            this.ctx.members();

        const promises = membersToRunAgainst.map(node => {
            // Guarantee that promise resolves.
            // it resolves to an object that indicates success
            // or failure.
            return node.run(query, params, neo4j.SYSTEM_DB)
                .then(results => clusterOpSuccess(node, results))
                .catch(err => clusterOpFailure(node, err));
        });

        return Promise.all(promises)
            .then(packageClusterOpResults);
    }

    changeUserPassword(user) {
        const { username, password } = user;

        if (!user || !password) {
            throw new Error('Call with an object containing keys username, password');
        }

        return this.clusterWideQuery(
            'CALL dbms.security.changeUserPassword($username, $password, false)',
            { username, password }
        )
            .then(result => {
                this.addEvent({
                    type: 'passwordchange',
                    message: `Changed password for ${username}`,
                    payload: username,
                });
                return result;
            });
    }

    addUser(user) {
        const { username, password } = user;
        if (!user || !password) {
            throw new Error('Call with object containing keys username, password');
        }

        return this.clusterWideQuery(
            'CALL dbms.security.createUser($username, $password, false)',
            { username, password }
        )
            .then(result => {
                this.addEvent({
                    type: 'adduser',
                    message: `Added user "${username}"`,
                    payload: username,
                });
                return result;
            })
    }

    deleteUser(user) {
        const { username } = user;
        if (!username) {
            throw new Error('Call with an object containing keys username');
        }

        return this.clusterWideQuery(
            'CALL dbms.security.deleteUser($username)',
            { username }
        )
            .then(result => {
                this.addEvent({
                    type: 'deleteuser',
                    message: `Deleted user "${username}"`,
                    payload: username,
                });
                return result;
            })
    }

    addRole(role) {
        if (!role) { throw new Error('Must provide role'); }

        return this.clusterWideQuery(
            'CALL dbms.security.createRole($role)',
            { role }
        )
            .then(result => {
                this.addEvent({
                    type: 'addrole',
                    message: `Created role "${role}"`,
                    payload: role,
                });
                return result;
            });
    }

    deleteRole(role) {
        if (!role) throw new Error('Must provide role');

        return this.clusterWideQuery(
            'CALL dbms.security.deleteRole($role)',
            { role }, neo4j.SYSTEM_DB
        )
            .then(result => {
                this.addEvent({
                    type: 'deleterole',
                    message: `Deleted role "${role}"`,
                    payload: role,
                });
                return result;
            });
    }

    /** Specific to a particular node */
    addNodeRole(node, username, role) {
        sentry.info('ADD ROLE', { username, role });
        return node.run('call dbms.security.addRoleToUser($role, $username)', { username, role }, neo4j.SYSTEM_DB);
    }

    /** Specific to a particular node */
    removeNodeRole(node, username, role) {
        sentry.info('REMOVE ROLE', { username, role });
        return node.run('call dbms.security.removeRoleFromUser($role, $username)', { username, role }, neo4j.SYSTEM_DB);
    }

    /**
     * @param {Object} user 
     * @param {Array} roles 
     * @returns {Promise} that resolves to a clusterOp result
     */
    associateUserToRoles(user, roles) {
        sentry.info(`CM associate ${user} to ${roles}`);
        if (!_.isArray(roles)) {
            throw new Error('roles must be an array');
        } if (!_.isObject(user) || !user.username) {
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
        const gatherRoles = (node) => {
            return node.run(ql.DBMS_SECURITY_USER_ROLES, { username }, neo4j.SYSTEM_DB)
                .then(results => neo4j.unpackResults(results, {
                    required: ['value'],
                }))
                // Pluck out only the role name to get to a simple array of strings
                // rather than array of objects.
                .then(results => results.map(r => r.value))
                .then(r => {
                    sentry.fine('gather roles made', r);
                    return r;
                });
        };

        const determineDifferences = (rolesHere, node) => {
            sentry.fine('determine differences', rolesHere, roles);
            const oldRoles = new Set(rolesHere);
            const newRoles = new Set(roles);
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

            sentry.fine('Determine differences',
                'rolesHere=', rolesHere, 'newRoles=', newRoles);
            sentry.fine('Role modification: ',
                node.getBoltAddress(), 'adding',
                [...toAdd],
                'removing', [...toDelete],
                'preserving', [...toPreserve]);
            return {
                toAdd: [...toAdd],
                toDelete: [...toDelete],
                toPreserve: [...toPreserve],
            };
        };

        const applyChanges = (roleChanges, node) => {
            const { toAdd, toDelete } = roleChanges;

            const addPromises = [...toAdd].map(role => this.addNodeRole(node, username, role));
            const delPromises = [...toDelete].map(role => this.removeNodeRole(node, username, role));

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
                .catch(err => {
                    sentry.reportError(err, 'Cluster operation failure applying role changes');
                    return clusterOpFailure(node, err);
                });
        };

        const allPromises = this.ctx.members().map(node => {
            return gatherRoles(node)
                .then(rolesHere => determineDifferences(rolesHere, node))
                .then(roleChanges => applyChanges(roleChanges, node))
                .then(() => {
                    this.addEvent({
                        type: 'roleassoc',
                        message: `Associated "${username}" to roles ${roles.map(r => `"${r}"`).join(', ')}`,
                        payload: { username, roles },
                    });
                })
                .then(() => clusterOpSuccess(node))
                .catch(err => clusterOpFailure(node, err));
        });

        return Promise.all(allPromises)
            .then(packageClusterOpResults);
    }

    databases() { return this._dbs; }

    getDefaultDatabase() {
        return this.databases().filter(db => db.isDefault)[0];
    }

    getRoles() {
        return this.ctx.getWriteMember().run('call dbms.security.listRoles()', {}, neo4j.SYSTEM_DB)
            .then(results => neo4j.unpackResults(results, {
                required: ['role', 'users'],
            }));
    }

    /**
     * Alter privileges in the cluster.  These are generally all void operations.
     * @param {PrivilegeOperation} op 
     * @returns true if successful.
     */
    alterPrivilege(op) {
        const error = op.validate();
        if (error) { throw new Error(error); }
        if (!this.ctx.getWriteMember().supportsSystemGraph()) {
            throw new Error('You cannot modify fine-grained privileges on a DB that does not support system graph');
        }

        return this.ctx.getWriteMember().run(op.buildQuery(), {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.fine('Privilege results', results);
                this.addEvent({
                    type: 'privilege',
                    message: op.buildQuery(),
                    payload: [],
                })
                
                // No results.
                return clusterOpSuccess(this.ctx.getWriteMember(), []);
            });
    }

    /**
     * Checks for which databases are online.  This triggers an 
     * actual query.
     * @returns Array{Database}
     */
    getDatabases() {
        return this.ctx.getWriteMember().run(ql.DBMS_4_SHOW_DATABASES, {}, neo4j.SYSTEM_DB)
            .then(results => neo4j.unpackResults(results, {
                required: ['name', 'status', 'default'],
            }))
            .then(results => results.map(r => new Database(r.name, r.status, r.default)))
            .then(dbs => {
                console.log('got dbs',dbs);
                this._dbs = dbs;
                return dbs;
            })
            .catch(err => {
                const str = `${err}`;

                // If either of these errors happened, no worries, the DB just doesn't support
                // multidatabase and we know what to do.
                // If it's any other error, that's interesting and should be reported as a potential
                // problem.
                const expectedErrors = [
                    'Invalid input',
                    'connected to the database that does not support multiple databases',
                ];

                let isAnExpectedError = expectedErrors.map(err => str.indexOf(err) > -1)
                    .reduce((a, b) => a || b, false);
                if (!isAnExpectedError) {
                    sentry.warn('ClusterManager#getDatabases() returned unexpected error', err);
                }

                sentry.info('Pre Neo4j 4.0, all clusters have a single database "neo4j"');
                // Just like we fake single-node Neo4j instances as a cluster of one member,
                // we fake non-multidb clusters as a multi-db of one database.  :)
                this._dbs = [new Database('neo4j', 'online', true)];
                return this._dbs;
            });
    }

    stopDatabase(db) {
        if (!db || !db.name) { throw new Error('Invalid or missing database'); }

        return this.ctx.getWriteMember().run(`STOP DATABASE ${db.name}`, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('stop results', results);
                return results;
            })
            .then(() => this.getDatabases())
            .then(() => this.addEvent({
                type: 'database',
                message: `Stopped database ${db.name}`,
                payload: db,
            }));
    }

    startDatabase(db) {
        if (!db || !db.name) { throw new Error('Invalid or missing database'); }

        return this.ctx.getWriteMember().run(`START DATABASE ${db.name}`, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('start results', results);
                return results;
            })
            .then(() => this.getDatabases())
            .then(() => this.addEvent({
                type: 'database',
                message: `Started database ${db.name}`,
                payload: db,
            }));
    }

    dropDatabase(db) {
        if (!db || !db.name) { throw new Error('Invalid or missing database'); }

        return this.ctx.getWriteMember().run(`DROP DATABASE ${db.name}`, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('drop results', results);
                return results;
            })
            .then(() => this.getDatabases())
            .then(() => this.addEvent({
                type: 'database',
                message: `Dropped database ${db.name}`,
            }));
    }

    createDatabase(name) {
        return this.ctx.getWriteMember().run(`CREATE DATABASE ${name}`, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('Created database; results ', results);
                return results;
            })
            .then(() => this.getDatabases())
            .then(() => this.addEvent({
                    type: 'database',
                    message: `Created database ${name}`,
                }));
    }
}