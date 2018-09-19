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

const dummy = diag => {
    return new InspectionResult(InspectionResult.INFO, 
        `You're running Halin ${diag.halin.version}, good for you!  You're already ahead of the game.`);
}

const rules = [
    dummy,
    ...memory,
    ...cluster,
    ...network,
];

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