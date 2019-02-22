// Wrap/hide the complexity of whether to choose the web neo4j driver
// or the regular one.
import neo4j from 'neo4j-driver';
import _ from 'lodash';

// As of Neo4j driver 1.7, no longer need to separately import
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

neo4j.isNeo4jInt = isNeo4jInt;
neo4j.handleNeo4jInt = handleNeo4jInt;

export default neo4j;