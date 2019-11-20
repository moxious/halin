import Advice from '../Advice';
import metarule from './metarule';
import util from '../../../data/util';

const clusterSize = metarule.clusterOnlyRule(pkg => {
    const findings = [];

    if (pkg.nodes.length % 2 === 0) {
        findings.push(Advice.warn({
            addr: Advice.CLUSTER,
            finding: `You have an even number of cluster nodes (${pkg.nodes.length})`,
            advice: 'Consider using an odd number of nodes to better balance',
        }));
    } else {
        findings.push(Advice.pass({
            addr: Advice.CLUSTER,
            finding: `You have an odd number of cluster nodes (${pkg.nodes.length})`,
        }));
    }

    return findings;
});

const nonStandardRoutingTTL = pkg => {
    const findings = [];
    const key = 'causal_clustering.cluster_routing_ttl';
    const recommended = '300s';

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;
        const val = node.configuration[key];

        const inMs = util.timeAbbreviation2Milliseconds(val);

        if (Number.isNaN(Number(inMs))) {
            findings.push(Advice.error({
                addr, 
                finding: `Configuration key ${key} has an invalid value: ${val}`,
                advice: `Consider setting this to the default value ${val}`
            }));
        } else if(inMs < util.timeAbbreviation2Milliseconds(recommended)) {
            findings.push(Advice.warn({
                addr, 
                finding: `Configuration key ${key} is set to a lower than default value`,
                advice: `Consider using the default (${recommended}) unless you are sure you know this
                is right for you.  Inappropriately low values may cause performance issues.`,
            }));
        } else {
            findings.push(Advice.pass({
                addr,
                finding: 'Cluster routing TTL looks good!',
            }));
        }
    });

    return findings;
};

const clusterShouldHaveWriter = pkg => {
    const findings = [];
    const writers = pkg.nodes.filter(n => n.basics.writer);

    if (writers.length === 1) {
        findings.push(Advice.pass({
            addr: Advice.CLUSTER,
            finding: `You have exactly 1 writer in your cluster (${writers[0].basics.label}).  Good!`,
        }));
    } else if (writers.length === 0) {
        findings.push(Advice.error({
            addr: Advice.CLUSTER,
            finding: `Your cluster lacks a member which can write`,
            advice: `This could be evidence of misconfiguration,
            a leader re-election in process, or too many node failures.  Investigate!`,
        }));
    } else if(writers.length > 1) {
        findings.push(Advice.error({
            addr: Advice.OVERALL,
            finding: `Your cluster has more than one write member`,
            advice: `This should never occur, and indicates either a bug in Halin or a misconfiguration of
            your cluster.  Please investigate.`,
        }));
    }

    return findings;
};

export default [
    clusterSize, clusterShouldHaveWriter, nonStandardRoutingTTL,
];