// Wrap/hide the complexity of whether to choose the web neo4j driver
// or the regular one.
import neo4j from 'neo4j-driver';
import _ from 'lodash';
import genericPool from 'generic-pool';
import sentry from '../sentry';

// As of Neo4j driver 1.7, no longer     need to separately import
// the minified web driver.
// let driverObj;
// driverObj = neo4j.v1;

// Admittedly a bit nasty, this code detects whether what we're looking at is really a neo4j driver
// int object, which is a special object designed to overcome the range differences between Neo4j numbers
// and what JS can support.
const isNeo4jInt = o =>
    o && _.isObject(o) && !_.isNil(o.high) && !_.isNil(o.low) && _.keys(o).length === 2;

const handleNeo4jInt = val => {
    if (!isNeo4jInt(val)) { return val; }
    return neo4j.integer.inSafeRange(val) ? val.toNumber() : neo4j.integer.toString(val);
};

const getValueFromRecord = (record, toExtract, required=false, defaultValue=null) => {
    /**
     * toExtract may either be a string "fooField" or a row object with an accessor, like:
     * { Header: "Whatever", accessor: 'fooField', absentValue: [] }
     */
    let field;
    if (typeof toExtract === 'string') {
        field = toExtract;
    } else {
        field = toExtract.accessor;
    }

    if (!field) {
        throw new Error(`Cannot determine which field to extract from record given ${JSON.stringify(toExtract)}`);
    }

    const dotted = field.indexOf('.') > -1;
    const resultField = dotted ? field.substring(0, field.indexOf('.')) : field;
    const restPath = dotted ? field.substring(field.indexOf('.') + 1) : null;

    try {
        const value = record.get(resultField);

        if (restPath) {
            return _.get(value, restPath);
        }

        return value;
    } catch (e) {
        if (required) { throw e; }

        // If the record specifies an absentValue, return that, otherwise
        // the default
        return _.get(toExtract, 'absentValue') || defaultValue;
    }
};

/**
 * Converts a Neo4j result set into an array of vanilla javascript objects.
 * Converts all numbers to either a number (if in range) or a string on a best effort
 * basis.  Permits the use of dot notation, so that you can extract a sub-field of
 * a map.
 * 
 * If a property is optional and it's missing, you will get null back.  If a property
 * is required and it's missing, you get an error thrown.
 * 
 * #operability this arose from a lot of boilerplate code I had been writing with the JS
 * driver.  Issues:  
 * - record.get() throws an error and doesn't let you specify a default if it's missing
 * - You have to do number handling on your own, every time.
 * 
 * @param {*} results the results object
 * @param {Object} schema consisting of two keys, required and optional.  Each of those
 * is an array of property names.
 * @returns {Array} of Objects
 */
const unpackResults = (results, schema) => results.records.map((record, index) => {
    const unpacked = { index };

    if (!schema || (!schema.required && !schema.optional)) {
        throw new Error('Unpack results was passed an invalid schema');
    }

    (schema.required || []).forEach(requiredField => {
        // Throws error if missing
        const value = getValueFromRecord(record, requiredField, true);
        unpacked[requiredField] = isNeo4jInt(value) ? handleNeo4jInt(value) : value;
    });

    (schema.optional || []).forEach(optionalField => {
        const value = getValueFromRecord(record, optionalField, false);
        unpacked[optionalField] = isNeo4jInt(value) ? handleNeo4jInt(value) : value;
    });

    return unpacked;
});

/**
 * A session pool is just what it sounds like.  In bolt, there is overhead associated
 * with sessions (particularly network round trips) that can increase latency.
 * For this reason we aggressively reuse sessions as much as we can without trying to run
 * more than one transaction on a given session.
 * 
 * This pool object lets users lease/release a session.  In general the strategies are the
 * ones who are pulling these sessions.
 */
const pools = {};
const getSessionPool = (id, driver, poolSize=15) => {
    // sentry.fine('POOL FOR', id);
    if (pools[id]) {
        sentry.fine('RECYCLE pool for ', id);
        return pools[id];
    }

    // How to create/destroy sessions.
    // See the generic-pool module for more details.
    const factory = {
        create: () => {
            const s = driver.session();
            return s;
        },
        destroy: session => {
            return session.close();
        },
        validate: session =>
            session.run('RETURN 1;', {})
                .then(() => true)
                .catch(() => false),
    };

    const sessionPoolOpts = { min: 3, max: Math.max(3, poolSize) };
    const sessionPool = genericPool.createPool(factory, sessionPoolOpts);
    
    sessionPool.on('factoryCreateError', err => sentry.reportError('SESSION POOL ERROR', err));
    sessionPool.on('factoryDestroyError', err => sentry.reportError('SESSION POOL DESTROY ERROR', err));
    sessionPool.start();

    pools[id] = sessionPool;
    return sessionPool;
};

neo4j.unpackResults = unpackResults;
neo4j.isNeo4jInt = isNeo4jInt;
neo4j.handleNeo4jInt = handleNeo4jInt;
neo4j.getSessionPool = getSessionPool;
neo4j.SYSTEM_DB = 'system';
neo4j.systemRoles = ['admin', 'reader', 'architect', 'publisher', 'editor', 'PUBLIC'];

export default neo4j;