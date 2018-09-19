import InspectionResult from '../InspectionResult';

const clusterSize = pkg => {
    const findings = [];

    if (pkg.nodes.length % 2 === 0) {
        findings.push(new InspectionResult(InspectionResult.WARN,
            `You have an even number of cluster nodes (${pkg.nodes.length})`,
            null,
            'Consider using an odd number of nodes to better balance'));
    }

    return findings;
};

export default [
    clusterSize,
];