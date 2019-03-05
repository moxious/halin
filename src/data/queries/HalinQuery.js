import pkg from '../../../package.json';
import _ from 'lodash';

/**
 * A HalinQuery is a container object for a complex cypher query that contains
 * several other parts:
 * 
 * - Optional parameters (these are descriptions of parameters, not instance values)
 * - Dependencies (i.e. must have APOC to run this)
 * - A set of column metadata that the query produces
 * - An example result
 * 
 * Queries then are a bit self-documenting, and the app can be thought of as
 * managing a library of these instances.
 * 
 * HalinQuery properties (constructor arguments)
 * - query: a cypher query, e.g. "MATCH (n) RETURN count(n) as value"
 * - columns: an array of result columns.  Each column must at a minimum have the keys
 * Header, accessor.  Columns may have the following additional keys: Cell, style, width,
 * show: (true|false), width
 * - rate: (optional) specifies an interval in ms to run the query
 * - parameters: (optional) an object with { paramName: 'description of param this query can take' }
 * - exampleResult: an array of objects providing an example of what the query is expected to return
 * - dependency: (optional) an object describing the query's dependencies (e.g. it requires APOC)
 */
class HalinQuery {
    constructor(props) {
        if (!props.query || !props.columns) {
            throw new Error('All queries require columns and query');
        }

        this.description = props.description || null;
        this.query = HalinQuery.disclaim(props.query);
        this.columns = props.columns;
        this.dependency = props.dependency || (() => ({
            pass: true,
            description: 'No dependencies',
        }));
        this.rate = _.isNil(props.rate) ? 1000 : props.rate;
        this.parameters = props.parameters || {};
        this.legendOnlyColumns = props.legendOnlyColumns || [];
        this.exampleResult = props.exampleResult || [];

        if (!this.query) { throw new Error('Missing query'); }
        if (_.isNil(this.columns)) { throw new Error('Missing columns'); }
    }

    getDependency() { return this.dependency; }
    getParameters() { return this.parameters; }
    getDescription() { return this.description; } 
    getQuery() { return this.query; }
    getColumns() { return this.columns; }
    getRate() { return this.rate; }

    /**
     * Example results form a type of documentation for a known query, so that
     * unit tests and other readers know what kind of data is expected back from
     * a query.
     * @returns {Array} of example object record results.
     */
    getExample() {
        return this.exampleResult;
    }

    static disclaim(query) {
        if (query.indexOf(HalinQuery.disclaimer) > -1) {
            return query;
        }   
    
        return `WITH ${HalinQuery.disclaimer} ${query}`;
    }
    static isDisclaimed(query) {
        return query.indexOf(HalinQuery.disclaimer) > -1;
    }
};

HalinQuery.disclaimer = `'This query was run by Halin v${pkg.version}' AS disclaimer\n`;
HalinQuery.transactionConfig = {
    timeout: 5000,
    metadata: {
        app: `halin-v${pkg.version}`,
        type: 'user-direct',
    },
};

export default HalinQuery;
