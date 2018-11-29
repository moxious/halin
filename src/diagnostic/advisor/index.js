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
import InspectionResult from './InspectionResult';

import memory from './rules/mem';
import cluster from './rules/cluster';
import network from './rules/network';
import indexAndConstraint from './rules/index-and-constraint';
import users from './rules/users';
import config from './rules/config';

const dummy = diag => {
    return [
        new InspectionResult(InspectionResult.INFO, 'overall',
            `You're running Halin ${diag.halin.version}, good for you!`,
            null,
            'You\'re already ahead of the game.'),
    ];
}

/**
 * The entire rule chain is simply a concat of all rules in all of the imported modules.
 */
const rules = [
    dummy,
    ...memory,
    ...cluster,
    ...network,
    ...indexAndConstraint,
    ...users,
    ...config,
];

/**
 * Generate advisor recommendations for a diagnostic package.
 * @param {Object} diagPackage the diagnostic package produced by Halin Context
 * @returns {Array} an array of InspectionResult objects.
 */
const generateRecommendations = diagPackage => {
    if (_.isNil(diagPackage) || !_.isObject(diagPackage) || !diagPackage.halin) {
        throw new Error('Invalid diagnostics package');
    }

    // Rule functions take a diagnostic package and produce an array of zero
    // or more InspectionResult objects.
    const allResults = _.flatten(rules.map(rule => rule(diagPackage)));
    return allResults;
};

export default {
    generateRecommendations,
};