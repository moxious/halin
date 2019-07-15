/**
 * Higher-order rules -- these all take a rule function and return a 'decorated' rule function.
 */
import _ from 'lodash';
import Advice from '../Advice';

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
const forConfigOption = (pkg, configOption, generator) => {
    const allValuesClusterWide = pkg.nodes.map(node => node.configuration[configOption]);
    const distinctClusterWide = _.uniq(allValuesClusterWide);

    // All config values are identical, so just run the rule once, and 
    // provide the cluster-wide address.  This prevents "recommender spam"
    // of getting the same recommendation on all cluster members when it's
    // always the same.
    if (distinctClusterWide.length === 1) {
        return [generator(Advice.CLUSTER, distinctClusterWide[0], pkg.nodes[0])];            
    }

    // There are differences in this config item among cluster nodes, so 
    // run the advisor rules one cluster node at a time.
    return pkg.nodes.map(node => {
        const val = node.configuration[configOption];
        const addr = node.basics.address;

        return generator(addr, val, node);
    });
};

export default {
    enterpriseOnlyRule, clusterOnlyRule, forConfigOption,
};