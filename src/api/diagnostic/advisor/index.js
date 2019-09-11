/**
 * The advisor takes a diagnostic bundle produced by Halin and produces
 * a set of recommendations sorted into three categories:
 * 
 * - Passed Checks
 * - Warnings
 * - Errors
 * 
 * Wherever possible, these items come with remediation information.
 * 
 * Advisors should not gather any data or require any bolt connection.
 * Instead they should just operate on the diagnostic package.
 */
import _ from 'lodash';
import Advice from './Advice';

import memory from './rules/mem';
import cluster from './rules/cluster';
import network from './rules/network';
import indexAndConstraint from './rules/index-and-constraint';
import users from './rules/users';
import config from './rules/config';
import versions from './rules/versions';
import security from './rules/security/';
import plugins from './rules/plugins';
import transactions from './rules/transactions';
import retention from './rules/retention';

const dummy = diag => {
    return [
        Advice.info({
            addr: Advice.CLUSTER,
            finding: `You're running Halin ${diag.halin.version}, good for you!`,
            advice: 'You\'re already ahead of the game.'
        }),
    ];
}

const categorize = (ruleFunctions, categoryName) => {
    // Takes a rule function, and returns a wrapped function.
    // The wrapper runs the same rules as the original, but tags a category
    // to each result that comes out of the rule function.
    // In this way we can categorize the output of an entire batch of functions
    // at the same time.
    const categorizeResults = (f, category) => 
        pkg => 
            (f(pkg) || []).map(itemOfAdvice => {
                itemOfAdvice.category = categoryName;
                return itemOfAdvice;
            });

    return ruleFunctions.map(f => categorizeResults(f));
};

/**
 * The entire rule chain is simply a concat of all rules in all of the imported modules.
 */
const rules = [
    ...categorize([dummy], 'General'),
    ...categorize(memory, 'Memory'),
    ...categorize(cluster, 'Cluster'),
    ...categorize(versions, 'Cluster'),
    ...categorize(network, 'Network'),
    ...categorize(indexAndConstraint, 'Graph Schema'),
    ...categorize(users, 'Users'),
    ...categorize(config, 'Configuration'),
    ...categorize(security, 'Security'),
    ...categorize(plugins, 'Plugins'),
    ...categorize(transactions, 'Transactions'),
    ...categorize(retention, 'Disk'),
];

/**
 * Generate advisor recommendations for a diagnostic package.
 * @param {Object} diagPackage the diagnostic package produced by Halin Context
 * @returns {Array} an array of Advice objects.
 */
const generateRecommendations = diagPackage => {
    if (_.isNil(diagPackage) || !_.isObject(diagPackage) || !diagPackage.halin) {
        throw new Error('Invalid diagnostics package');
    }

    // Rule functions take a diagnostic package and produce an array of zero
    // or more Advice objects.
    const allResults = _.flatten(rules.map(rule => rule(diagPackage)));

    // In case any rule returned a falsy value, toss it out, otherwise
    // the UI components which call us choke on bad data.
    return allResults.filter(x => x);
};

export default {
    generateRecommendations,
};