import InspectionResult from '../InspectionResult';

const memActuals = pkg => {
    const findings = [];

    pkg.halin.dataFeeds
        .filter(df => (df.label === 'OS_MEMORY_STATS' && df.lastObservation))
        .forEach(dataFeed => {
            const addr = dataFeed.address;

            const obs = dataFeed.lastObservation;
            const freeRatio = obs.physFree / obs.physTotal;

            if (!Number.isNaN(freeRation) && freeRatio <= 0.1) {
                findings.push(new InspectionResult(InspectionResult.WARN,
                    addr,
                    'At time of measurement, your memory utilization was very high',
                    'Consider looking at memory configuration for your system'));
            }
        });

    return findings;
}

const memSettings = pkg => {
    const settings = [
        'dbms.memory.heap.initial_size',
        'dbms.memory.heap.max_size',
        'dbms.memory.pagecache.size',
    ];

    const findings = [];

    pkg.nodes.forEach(node => {
        let incomplete = false;
        const addr = node.basics.address;

        settings.forEach(setting => {
            const val = node.configuration[setting];

            if (!val) {
                findings.push(new InspectionResult(InspectionResult.WARN,
                    addr,
                    `No value specified for ${setting}`, null,
                    'For best performance, these values should be set. Consider running neo4j-admin memrec'));
                incomplete = true;
            }
        });

        if (!incomplete) {
            findings.push(new InspectionResult(InspectionResult.PASS,
                addr, 
                `Found configured memory settings.  Good!`));
        }
    });

    return findings;
};

export default [
    memSettings, memActuals,
];