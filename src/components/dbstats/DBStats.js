import neo4j from '../../api/driver';
import ql from '../../api/data/queries/query-library';
import _ from 'lodash';

/**
 * This class encapsulates functionality around the db.stats.* procedures.
 * See: https://neo4j.com/docs/operations-manual/current/reference/procedures/
 * 
 * TODO -- adapt for multidatabase.  Because sessions don't get a database
 * parameter here, implicitly we're gathering stats about the default database.
 */
export default class DBStats {
    /**
     * @param {ClusterMember} clusterMember which member to collect stats from
     * @param {String} database database name
     */
    constructor(clusterMember, database) {
        this.clusterMember = clusterMember;
        this.database = database;

        if (_.isNil(database)) {
            throw new Error('DBStats must be initialized with a database');
        }

        this.started = false;
    }

    start() {
        if (this.started) {
            return Promise.resolve(true);
        }

        return this.clusterMember.run(ql.DB_QUERY_STATS_COLLECT, {}, this.database)
            .then(() => {
                this.started = true;
                return true;
            });
    }

    average(list) {
        if (list.length === 0) {
            return 0;
        }

        return list.reduce((a, b) => a + b, 0) / list.length;
    }

    stats() {
        return this.clusterMember.run(ql.DB_QUERY_STATS, {}, this.database)
            .then(results => results.records.map(r => ({
                query: r.get('query'),
                qep: r.get('qep'),
                invocationCount: neo4j.handleNeo4jInt(r.get('invocationCount')),
                compileMin: neo4j.handleNeo4jInt(r.get('compileMin')),
                compileMax: neo4j.handleNeo4jInt(r.get('compileMax')),
                compileAvg: neo4j.handleNeo4jInt(r.get('compileAvg')),
                executeMin: neo4j.handleNeo4jInt(r.get('executeMin')),
                executeMax: neo4j.handleNeo4jInt(r.get('executeMax')),
                executeAvg: neo4j.handleNeo4jInt(r.get('executeAvg')),
                estimatedRows: this.average(r.get('estimatedRows').map(neo4j.handleNeo4jInt)),
                invocations: r.get('invocations'),
            })));
    }

    stop() {
        if (!this.started) {
            return Promise.resolve(false);
        }

        return this.clusterMember.run(ql.DB_QUERY_STATS_STOP, {}, this.database)
            .then(() => {
                this.started = false;
                return true;
            });
    }

    isStarted() { return this.started; }
}