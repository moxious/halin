import _ from 'lodash';
import sentry from '../api/sentry';
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
        const names = _.uniqBy('name', arrOfResults);
        if (names.length > 1) {
            throw new Error('Inconsistent multi-name array of results');
        }

        this.name = arrOfResults[0].name;
        this.backingStatuses = arrOfResults;
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

    static pre4DummyDatabase() {
        return new Database([{
            name: 'neo4j',
            currentStatus: 'online',
            requestedStatus: 'online',
            default: true,
            error: null,
            address: '',
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

        console.log(resultingDBs);
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
            reconciling = reconciling || (this.currentStatus !== this.requestedStatus);
        });

        return reconciling;
    }

    hasError() {
        return this.backingStatuses.filter(e => e.error).length > 0;
    }

    getStatuses() {
        return this.backingStatuses.map(s => s.currentStatus);
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