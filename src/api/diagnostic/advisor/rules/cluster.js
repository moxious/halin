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
    clusterSize, clusterShouldHaveWriter,
];