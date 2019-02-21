import queryLibrary from '../data/query-library';
import { v1 as neo4j } from 'neo4j-driver';
import _ from 'lodash';

const isNeo4jInt = o =>
    o && _.isObject(o) && !_.isNil(o.high) && !_.isNil(o.low) && _.keys(o).length === 2;


const handleNeo4jInt = val => {
    if (!isNeo4jInt(val)) { return val; }
    return neo4j.integer.inSafeRange(val) ? val.toNumber() : neo4j.integer.toString(val);
};

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

        return session.run('call db.stats.collect("QUERIES")')
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

        return session.run(queryLibrary.DB_QUERY_STATS.query)
            .then(results => results.records.map(r => ({
                query: r.get('query'),
                qep: r.get('qep'),
                invocationCount: handleNeo4jInt(r.get('invocationCount')),
                compileMin: handleNeo4jInt(r.get('compileMin')),
                compileMax: handleNeo4jInt(r.get('compileMax')),
                compileAvg: handleNeo4jInt(r.get('compileAvg')),
                executeMin: handleNeo4jInt(r.get('executeMin')),
                executeMax: handleNeo4jInt(r.get('executeMax')),
                executeAvg: handleNeo4jInt(r.get('executeAvg')),
                estimatedRows: this.average(r.get('estimatedRows').map(handleNeo4jInt)),
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