import InspectionResult from '../InspectionResult';

const memSettings = pkg => {
    const settings = [
        'dbms.memory.heap.initial_size',
        'dbms.memory.heap.max_size',
        'dbms.memory.pagecache.size',
    ];

    const findings = [];

    pkg.nodes.forEach(node => {
        settings.forEach(setting => {
            const addr = node.basics.address;
            const nodeSetting = node.configuration.filter(s => s.name === setting)[0];

            if (nodeSetting && !nodeSetting.value) {
                findings.push(new InspectionResult(InspectionResult.WARN,
                    `${addr} has no value specified for ${setting}`, null,
                    'For best performance, these values should be set. Consider running neo4j-admin memrec'));
            }
        });
    });

    return findings;
};

export default [
    memSettings,
];