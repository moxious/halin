// Wrap/hide the complexity of whether to choose the web neo4j driver
// or the regular one.
let driverObj;

try {
    if (window) {
        driverObj = require('neo4j-driver/lib/browser/neo4j-web.min.js').v1;
    } else { 
        driverObj = require('neo4j-driver').v1;
    }
} catch (e) {
    // ReferenceError if window isn't defined.
    driverObj = require('neo4j-driver').v1;
}

export default driverObj;