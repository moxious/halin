import _ from 'lodash';
import Promise from 'bluebird';
import sentry from '../sentry/index';
import moment from 'moment';
import uuid from 'uuid';
import Ring from 'ringjs';
import neo4j from '../driver/index';
import ql from '../data/queries/query-library';
import Database from '../Database';
import Metric from '../Metric';

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

/**
 * This object acts as a metric of its own, keeping cluster-wide events in an event log,
 * and also permitting cluster-wide queries to be executed in a way that is cross-Neo4j
 * version compatible.
 */
export default class ClusterManager extends Metric {
    constructor(halinCtx) {
        super();
        this.ctx = halinCtx;
        this.eventLog = new Ring(MAX_EVENTS);
    }

    /** @override Metric#currentState */
    currentState() {
        return this.eventLog.toArray();
    }    

    /** @override Metric#isFresh */
    isFresh() { return true; }

    addEvent(event) {
        if (!event.message || !event.type) {
            throw new Error('ClusterManager events must have at least message, type');
        }

        // Don't modify caller's argument.
        const data = _.cloneDeep(event);
        _.set(data, 'date', moment.utc().toISOString());
        _.set(data, 'payload', event.payload || null);
        _.set(data, 'id', uuid.v4());
        _.set(data, 'address', data.event || 'all members');
        this.eventLog.push(data);

        // Notify listeners.
        this._notifyListeners('data', [event, this]);
        return event;
    }

    getEventLog() {
        return this.currentState();
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
            [this.ctx.getSystemDBWriter()] :
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
                    alert: true,
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
                    alert: true,
                });
                return result;
            })
    }

    copyRole(existingRole, toBeCreatedRole) {
        return this.clusterWideQuery(`CREATE ROLE \`${toBeCreatedRole}\` AS COPY OF \`${existingRole}\``)
            .then(result => {
                this.addEvent({
                    type: 'addrole',
                    message: `Created role ${toBeCreatedRole} as copy of ${existingRole}`,
                    payload: { existingRole, toBeCreatedRole },
                    alert: true,
                });
                return result;
            });
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
                    alert: true,
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
                    alert: true,
                });
                return result;
            });
    }

    /** Specific to a particular node */
    addNodeRole(node, username, role) {
        sentry.info('ADD ROLE', { username, role, addr: node.getBoltAddress() });
        return node.run('call dbms.security.addRoleToUser($role, $username)', { username, role }, neo4j.SYSTEM_DB);
    }

    /** Specific to a particular node */
    removeNodeRole(node, username, role) {
        sentry.info('REMOVE ROLE', { username, role, addr: node.getBoltAddress() });
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

        const membersToRunAgainst = this.ctx.supportsSystemGraph() ? 
            [this.ctx.getSystemDBWriter()] : 
            this.ctx.members();

        const allPromises = membersToRunAgainst.map(node => {
            return gatherRoles(node)
                .then(rolesHere => determineDifferences(rolesHere, node))
                .then(roleChanges => applyChanges(roleChanges, node))
                .then(() => {
                    this.addEvent({
                        type: 'roleassoc',
                        message: `Associated "${username}" to roles ${roles.map(r => `"${r}"`).join(', ')}`,
                        alert: true,
                        payload: { username, roles },
                    });
                })
                .then(() => clusterOpSuccess(node))
                .catch(err => clusterOpFailure(node, err));
        });

        return Promise.all(allPromises)
            .then(packageClusterOpResults);
    }

    getRoles() {
        return this.ctx.getSystemDBWriter().run('call dbms.security.listRoles()', {}, neo4j.SYSTEM_DB)
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
        if (!this.ctx.getSystemDBWriter().supportsSystemGraph()) {
            throw new Error('You cannot modify fine-grained privileges on a DB that does not support system graph');
        }

        return this.ctx.getSystemDBWriter().run(op.buildQuery(), {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.fine('Privilege results', results);
                this.addEvent({
                    type: 'privilege',
                    message: op.buildQuery(),
                    payload: [],
                })

                // No results.
                return clusterOpSuccess(this.ctx.getSystemDBWriter(), []);
            });
    }

    /**
     * Checks for which databases are online.  This triggers an 
     * actual query.
     * @returns Array{Database}
     */
    getDatabases() {
        return this.ctx.getSystemDBWriter().run(ql.DBMS_4_SHOW_DATABASES, {}, neo4j.SYSTEM_DB)
            .then(results => neo4j.unpackResults(results, {
                required: [
                    'name', 'address', 'role',
                    'requestedStatus', 'currentStatus',
                    'default', 'error',
                ],
            }))
            .then(results => {
                this._dbs = Database.fromArrayOfResults(results);
                return this._dbs;
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
                this._dbs = [Database.pre4DummyDatabase(this.ctx)];
                return this._dbs;
            });
    }

    stopDatabase(db) {
        if (!db || !db.name) { throw new Error('Invalid or missing database'); }

        return this.ctx.getSystemDBWriter().run(`STOP DATABASE \`${db.name}\``, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('stop results', results);
                return results;
            })
            .then(() => this.ctx.getDatabaseSet().refresh(this.ctx))
            .then(() => this.addEvent({
                type: 'database',
                alert: true,
                message: `Stopped database ${db.name}`,
                payload: db,
            }));
    }

    startDatabase(db) {
        if (!db || !db.name) { throw new Error('Invalid or missing database'); }

        return this.ctx.getSystemDBWriter().run(`START DATABASE \`${db.name}\``, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('start results', results);
                return results;
            })
            .then(() => this.ctx.getDatabaseSet().refresh(this.ctx))
            .then(() => this.addEvent({
                type: 'database',
                alert: true,
                message: `Started database ${db.name}`,
                payload: db,
            }));
    }

    dropDatabase(db) {
        if (!db || !db.name) { throw new Error('Invalid or missing database'); }

        return this.ctx.getSystemDBWriter().run(`DROP DATABASE \`${db.name}\``, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('drop results', results);
                return results;
            })
            .then(() => this.ctx.getDatabaseSet().refresh(this.ctx))
            .then(() => this.addEvent({
                type: 'database',
                alert: true,
                message: `Dropped database ${db.name}`,
            }));
    }

    /**
     * Create a new Database (multidb Neo4j >= 4.0 only)
     * #operability - the system CREATE DATABASE returns immediately, but it may be 1-2 minutes
     * before the database is replicated, available, and has a leader election in place.  This means
     * after CREATE DATABASE (which returns nothing) there's no way to tell if anything is happening
     * unless you poll show databases.
     * @param {String} name of the database you want to create
     */
    createDatabase(name) {
        return this.ctx.getSystemDBWriter().run(`CREATE DATABASE \`${name}\``, {}, neo4j.SYSTEM_DB)
            .then(results => {
                sentry.info('Created database; results ', results);
                return results;
            })
            .then(() => this.ctx.getDatabaseSet().refresh(this.ctx))
            .then(() => this.addEvent({
                type: 'database',
                alert: true,
                message: `Created database ${name}`,
            }));
    }

    /**
     * Gets the total amount of data on disk used by the various databases.  Applies to Neo4j >= 4.0.
     * @returns {Object} that is a map of databaseName => total disk size in bytes.
     * @throws {Error} if using this on a database that is pre-Neo4j 4.0
     */
    getDatabaseStoreSizes() {
        if (this.ctx.getVersion().major < 4) {
            throw new Error('This operation only applies to Neo4j >= 4.0');
        }

        const databaseNames = this.ctx.databases().map(db => db.getLabel());

        const storeSizes = {};

        // Run the store size fetch on each database, collecting results into a single map.
        const fetchAllSizes = Promise.all(Promise.map(databaseNames, name => {
            return this.ctx.getSystemDBWriter().run(ql.JMX_4_TOTAL_STORE_SIZE, { db: name })
                .then(results => neo4j.unpackResults(results, {
                    required: ['sizeInBytes'],
                }))
                .then(results => {
                    const val = _.get(results[0], 'sizeInBytes') || 0;
                    storeSizes[name] = val;
                });
        }, { concurrency: 3 }));

        return fetchAllSizes.then(() => storeSizes);
    }
}