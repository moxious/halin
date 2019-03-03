import neo4j from '../driver';
import ql from '../data/queries/query-library';
import HalinQuery from '../data/queries/HalinQuery';

/**
 * This class encapsulates functionality around the db.stats.* procedures.
 * See: https://neo4j.com/docs/operations-manual/current/reference/procedures/
 */
export default class DBStats {
    constructor(driver) {
        this.driver = driver;
        this.started = false;
    }

    start() {
        if (this.started) {
            return Promise.resolve(true);
        }

        const session = this.driver.session();

        return session.run(HalinQuery.disclaim(`
            CALL db.stats.clear('QUERIES') 
            YIELD section 
            RETURN section 
            
            UNION ALL 
            
            CALL db.stats.collect('QUERIES') 
            YIELD section 
            RETURN section;
        `))
            .then(() => {
                this.started = true;
                return true;
            })
            .finally(() => session.close());
    }

    average(list) {
        if (list.length === 0) {
            return 0;
        }

        return list.reduce((a, b) => a + b, 0) / list.length;
    }

    stats() {
        const session = this.driver.session();

        return session.run(ql.DB_QUERY_STATS.query)
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
            })))
            .finally(() => session.close());
    }

    stop() {
        if (!this.started) {
            return Promise.resolve(false);
        }

        const session = this.driver.session();
        return session.run('call db.stats.stop("QUERIES");')
            .then(() => {
                this.started = false;
                return true;
            })
            .finally(() => session.close());
    }

    isStarted() { return this.started; }
}