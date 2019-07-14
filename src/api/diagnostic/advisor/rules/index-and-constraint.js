import Advice from '../Advice';

const indexes = pkg => {
    const findings = [];

    // Indexes get replicated so only look at one.
    const node = pkg.nodes[0];

    if (node.indexes.length === 0) {
        findings.push(Advice.warn({
            finding: 'You have no database indexes defined',
            advice: 'Consider using database indexes to speed query access',
        }));
    } else {
        findings.push(Advice.pass({
            finding: 'You have defined indexes.  Good!',
        }));
    }

    if (node.constraints.length === 0) {
        findings.push(Advice.warn({
            finding: 'You have no constraints defined',
            advice: 'Consider using constraints to assert semantics about your data, and speed access',
        }));
    } else {
        findings.push(Advice.pass({ finding: 'You have defined constraints.  Good!' }));
    }

    const notOnline = node.indexes.filter(idx => idx.state !== 'ONLINE');

    notOnline.forEach(idx => {
        findings.push(Advice.warn({
            finding: `The index ${idx.description} is in state ${idx.state}`,
            advice: 'Indexes which are not online may not help your performance',
        }));
    });

    return findings;
};

export default [
    indexes,
];