/**
 * Higher-order rules -- these all take a rule function and return a 'decorated' rule function.
 */
import _ from 'lodash';

const clusterOnlyRule = ruleFunction => {
    return pkg => {
        const isCluster = _.get(pkg, 'halin.cluster');

        if (!isCluster) {
            // Short-circuit and return no findings from a function, because it doesn't apply to 
            // single nodes.
            return [];
        }
    };
};

const enterpriseOnlyRule = ruleFunction => {
    return pkg => {
        const isEnterprise = _.get(pkg, 'halin.enterprise');

        if (!isEnterprise) {
            // Short-circuit and return no findings from the given rule function, because it doesn't
            // apply to community.
            return [];
        }

        return ruleFunction(pkg);
    };
};

export default {
    enterpriseOnlyRule, clusterOnlyRule,
};