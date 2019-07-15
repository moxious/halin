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

/**
 * 
 * @param {*} pkg diagnostic package
 * @param {*} configOption string with name of config option the rule is interested in
 * @param {*} generator function which takes (addr, value, node) and returns [Advice]
 */
const forConfigOption = (pkg, configOption, generator) =>
    pkg.nodes.map(node => {
        const val = node.configuration[configOption];
        const addr = node.basics.address;

        return generator(addr, val, node);
    });

export default {
    enterpriseOnlyRule, clusterOnlyRule, forConfigOption,
};