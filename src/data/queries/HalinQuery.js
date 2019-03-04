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
 */
class HalinQuery {
    constructor(props) {
        if (!props.query || !props.columns) {
            throw new Error('All queries require columns and query');
        }

        this.query = HalinQuery.disclaim(props.query);
        this.columns = props.columns;
        this.dependency = props.dependency || null;
        this.rate = _.isNil(props.rate) ? 1000 : props.rate;
        this.parameters = props.parameters || {};
        this.legendOnlyColumns = props.legendOnlyColumns || [];
        this.exampleResult = props.exampleResult || [];

        this.validate();
    }

    /**
     * Example results form a type of documentation for a known query, so that
     * unit tests and other readers know what kind of data is expected back from
     * a query.
     * @returns {Array} of example object record results.
     */
    getExamples() {
        return this.exampleResult;
    }

    validate() {
        if (_.isNil(this.columns) || this.columns.length === 0) {
            throw new Error(`Missing columns on query ${this.query}`);
        }

        this.columns.forEach((column, i) => {
            if (!column || !column.accessor) {
                console.error(column);
                throw new Error(`Column ${i} of query ${this.query} is invalid or missing accessor`);
            }
        });

        if (this.rate < 0) {
            throw new Error('Rate must be positive');
        }

        return true;
    }

    static disclaim(query) {
        if (query.indexOf(HalinQuery.disclaimer) > -1) {
            return query;
        }   
    
        return `WITH ${HalinQuery.disclaimer} ${query}`;
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
