import InspectionResult from '../InspectionResult';

const indexes = pkg => {
    const findings = [];

    // Indexes get replicated so only look at one.
    const node = pkg.nodes[0];

    if (node.indexes.length === 0) {
        findings.push(new InspectionResult(InspectionResult.WARN,
            'overall',
            'You have no database indexes defined', null,
            'Consider using database indexes to speed query access'));
    } else {
        findings.push(new InspectionResult(
            InspectionResult.PASS, 'overall',
            'You have defined indexes.  Good!'
        ));
    }

    if (node.constraints.length === 0) {
        findings.push(new InspectionResult(InspectionResult.WARN,
            'overall',
            'You have no constraints defined',
            null,
            'Consider using constraints to assert semantics about your data, and speed access'));
    } else {
        findings.push(new InspectionResult(
            InspectionResult.PASS, 'overall',
            'You have defined constraints.  Good!'
        ));
    }

    const notOnline = node.indexes.filter(idx => idx.state !== 'ONLINE');

    notOnline.forEach(idx => {
        findings.push(new InspectionResult(InspectionResult.WARNING,
            'overall',
            `The index ${idx.description} is in state ${idx.state}`,
            idx,
            'Indexes which are not online may not help your performance'));
    });

    return findings;
};

export default [
    indexes,
];