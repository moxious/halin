import InspectionResult from '../InspectionResult';
import metarule from './metarule';

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

export default [
    clusterSize,
];