// Wrap/hide the complexity of whether to choose the web neo4j driver
// or the regular one.
import neo4j from 'neo4j-driver';
// As of Neo4j driver 1.7, no longer need to separately import
// the minified web driver.
// let driverObj;
// driverObj = neo4j.v1;

export default neo4j;