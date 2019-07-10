import InspectionResult from '../InspectionResult';
import metarule from './metarule';
import util from '../../../data/util';

const clusterSize = metarule.clusterOnlyRule(pkg => {
    const findings = [];

    if (pkg.nodes.length % 2 === 0) {
        findings.push(new InspectionResult(InspectionResult.WARN,
            'overall',
            `You have an even number of cluster nodes (${pkg.nodes.length})`,
            null,
            'Consider using an odd number of nodes to better balance'));
    } else {
        findings.push(new InspectionResult(InspectionResult.PASS, 
            'overall',
            `You have an odd number of cluster nodes (${pkg.nodes.length})`,
            null,
            'N/A'));
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
            findings.push(InspectionResult(InspectionResult.ERROR,
                addr, `Configuration key ${key} has an invalid value: ${val}`,
                null, `Consider setting this to the default value ${val}`));
        } else if(inMs < util.timeAbbreviation2Milliseconds(recommended)) {
            findings.push(new InspectionResult(InspectionResult.WARN,
                addr, `Configuration key ${key} is set to a lower than default value`,
                null, `Consider using the default (${recommended}) unless you are sure you know this
                is right for you.  Inappropriately low values may cause performance issues.`));
        } else {
            findings.push(new InspectionResult(InspectionResult.PASS, addr,
                'Cluster routing TTL looks good!', null, 'N/A'));
        }
    });

    return findings;
};

const clusterShouldHaveWriter = pkg => {
    const findings = [];
    const writers = pkg.nodes.filter(n => n.basics.writer);

    if (writers.length === 1) {
        findings.push(new InspectionResult(InspectionResult.PASS,
            'overall',
            `You have exactly 1 writer in your cluster (${writers[0].basics.label}).  Good!`, null, 'N/A'));
    } else if (writers.length === 0) {
        findings.push(new InspectionResult(InspectionResult.ERROR,
            'overall',
            `Your cluster lacks a member which can write`,
            null, 
            `This could be evidence of misconfiguration,
            a leader re-election in process, or too many node failures.  Investigate!`));
    } else if(writers.length > 1) {
        findings.push(new InspectionResult(InspectionResult.ERROR,
            'overall',
            `Your cluster has more than one write member`,
            null, 
            `This should never occur, and indicates either a bug in Halin or a misconfiguration of
            your cluster.  Please investigate.`));
    }

    return findings;
};

export default [
    clusterSize, clusterShouldHaveWriter, nonStandardRoutingTTL,
];