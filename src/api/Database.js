import _ from 'lodash';
import sentry from '../api/sentry';
import ClusterMember from '../api/cluster/ClusterMember';
import Parser from 'uri-parser';

/**
 * A database is a graph that can be stored within Neo4j.
 * 
 * Multi-database starts with Neo4j >= 4.0.  For versions of Neo4j prior to 4,
 * the HalinContext will fake a single database.
 * 
 * Neo4j doesn't have a clustered abstraction of a database, instead there is a cluster
 * member database, and to understand database status, you have to look at all the members
 * and understand the net of that situation.
 * 
 * Docs on database state: https://neo4j.com/docs/operations-manual/4.0-preview/monitoring/individual-db-states/
 */

export default class Database {
    /**
     * This is the name of the database for Neo4j prior to 4, when multidb wasn't available.
     */
    static SINGLEDB_NAME = 'neo4j';
    static STATUS_ONLINE = 'online';

    constructor(arrOfResults) {
        if (!_.isArray(arrOfResults)) {
            throw new Error('Databases must be initialized with an array of results from SHOW DATABASES');
        }

        const keys = ['name', 'address', 'role', 'requestedStatus', 'currentStatus',
            'default', 'error'];

        arrOfResults.forEach(obj => {
            keys.forEach(k => {
                if (_.isNil(obj[k])) {
                    throw new Error(`Initializing Database objects requires key ${k}`);
                }
            });
        });

        // All records must pertain to the same database name, otherwise we're mixing
        // inputs and you get nonsense.
        const names = _.uniq(arrOfResults.map(r => r.name));
        if (names.length > 1) {
            throw new Error('Inconsistent multi-name array of results');
        }

        this.name = arrOfResults[0].name;
        this.backingStatuses = arrOfResults;
        this.created = new Date();
    }

    /**
     * Merges changes with an existing database of the same name
     * @param {Database} changes the new one to take changes from
     * @returns true if something changed, false otherwise.
     * @throws {Error} if the names don't match
     */
    merge(changes) {
        if (!changes instanceof Database || !changes.name === this.name) {
            throw new Error('Cannot merge with a different or non-Database');
        }

        let changed = false;
        if (!_.isEqual(this.backingStatuses, changes.backingStatuses)) {
            this.backingStatuses = _.cloneDeep(changes.backingStatuses);
            sentry.fine(`Database ${this.name} statuses changed`);
            changed = true;
        }

        this.created = changes.created;
        return changed;
    }

    asJSON() {
        return {
            name: this.name,
            statuses: this.backingStatuses,
        };
    }

    isDefault() {
        return this.backingStatuses[0].default;
    }

    static pre4DummyDatabase(halin) {
        return new Database([{
            name: Database.SINGLEDB_NAME,
            currentStatus: Database.STATUS_ONLINE,
            requestedStatus: Database.STATUS_ONLINE,
            role: 'LEADER',
            default: true,
            error: '',
            address: halin ? halin.getBaseURI() : '0.0.0.0',
        }]);
    }

    static fromArrayOfResults(arr) {
        // Note that SHOW DATABASES does not return 1 row per database. 
        // Instead, it returns 1 row per database, per Neo4j instance in the cluster. 
        // Therefore, if you have a 4-instance cluster, hosting 3 databases, you will
        // have 12 rows.
        // https://neo4j.com/docs/operations-manual/4.0-preview/monitoring/individual-db-states/
        const dbs = _.groupBy(arr, 'name');

        const resultingDBs = [];
        Object.keys(dbs).forEach(dbName => {
            // This is an array of results grouped by name.
            resultingDBs.push(new Database(dbs[dbName]));
        });

        return resultingDBs;
    }

    getLabel() {
        return this.name;
    }

    /**
     * If currentStatus and requestedStatus do not match on any cluster member, the database
     * is currently reconciling or errored.
     */
    isReconciling() {
        let reconciling = false;
        this.backingStatuses.forEach(s => {
            reconciling = reconciling || (s.currentStatus !== s.requestedStatus);
        });

        return reconciling;
    }

    hasError() {
        return this.backingStatuses.filter(e => e.error).length > 0;
    }

    getMemberStatuses() {
        return this.backingStatuses;
    }

    getStatuses() {
        return _.uniq(this.backingStatuses.map(s => s.currentStatus));
    }

    getMembersByRole(halin) {
        const members = halin.members();
        const results = {};

        members.forEach(member => {
            const roles = member.getDatabaseRoles();
            const roleHere = roles[this.name] || 'DATABASE OFFLINE';

            if (!(roleHere in results)) {
                results[roleHere] = [member];
            } else {
                results[roleHere].push(member);
            }
        });

        return results;
    }

    /**
     * Return the ClusterMember who is the leader of this database.
     * @param {HalinContext} a halin context object
     * @returns {ClusterMember} the leader, or nil if there is none.
     * @throws {Error} when there is no leader, or there are multiples (inconsistent cluster)
     */
    getLeader(halin) {
        if (halin.members().length === 1) {
            // In standalone mode...it's pretty obvious.
            return halin.members()[0];
        }

        const leaders = this.getMemberStatuses()
            .filter(s => {
                const r = s.role.toUpperCase();
                return r === ClusterMember.ROLE_LEADER ||
                    r === ClusterMember.ROLE_STANDALONE ||
                    r === ClusterMember.ROLE_SINGLE;
            });

        if (leaders.length === 0) {            
            sentry.warn(`Database ${this.name} has no leader; election may be underway`);
            return null;
        } else if(leaders.length > 1) {
            const leadersStr = JSON.stringify(leaders, null, 2);
            throw new Error(`Database ${this.name} has more than one leader (${leadersStr}); inconsistent cluster`);
        }

        const leaderAddress = leaders[0].address;
        // #operability It's very hard to match database addresses to cluster members.
        // The database address is yielded like:  '1.2.3.4:7687'.  But cluster members
        // (via dbms.cluster.overview or other methods) don't expose addresess like that,
        // they identify themselves with protocol like 'bolt'.  So to find the corresponding
        // member, we have to parse the URIs and see whose host and port matches.
        const [leaderHost, leaderPort] = leaderAddress.split(':');

        const found = halin.members().filter(member => {
            const candidate = Parser.parse(member.getBoltAddress());
            if (leaderHost === candidate.host && leaderPort === candidate.port) {
                // Winner winner chicken dinner
                return true;
            }
            return false;
        });

        if (found.length === 1) {
            return found[0];
        } else if (found.length > 1) {
            throw new Error('Inconsistent cluster member address table; > 1 leader matching address');
        }

        const addrs = halin.members().map(m => m.getBoltAddress()).map(x => Parser.parse(x)).map(x => JSON.stringify(_.pick(x, ['host', 'port'])));
        sentry.error(`Searching for leader address ${leaderAddress} (host=${leaderHost} port=${leaderPort}) failed among ${addrs.join(', ')}`);
        return null;
    }

    getStatus() {
        const statuses = this.getStatuses();

        if (statuses.length === 1) { return statuses[0]; }

        sentry.warn('DB has multiple statuses', this.asJSON());
        return statuses[0];
    }

    isOnline() { 
        const statuses = this.getStatuses();
        const uniq = _.uniq(statuses);

        if (uniq.length === 1 && uniq[0] === 'online') { 
            return true;
        }

        return false;
    }
}