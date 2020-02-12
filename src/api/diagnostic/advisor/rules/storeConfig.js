import Advice from '../Advice';
import _ from 'lodash';
import util from '../../../data/util';

const nodeStorage = pkg => {
    const findings = [];

    // For what this is about, see: https://github.com/moxious/halin/issues/132
    const THRESHOLD = (34 * /*1000000000*/ 100) * 0.9; // 90% of 34 billion

    console.log('PKG',pkg);

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;
        const val = node.configuration['dbms.record_format'] || 'standard';

        // The warning check doesn't apply if they've already enabled high limits.
        if (val === 'high_limit') {
            findings.push(Advice.info({
                addr,
                finding: 'You are using dbms.record_format=high limit',                
            }));
            return null;
        }

        pkg.databases.filter(db => db.nodeCount !== -1).forEach(database => {
            const count = database.nodeCount;
            const name = database.name;

            if (count >= THRESHOLD) {
                findings.push(Advice.warn({
                    addr,
                    database: name,
                    finding: `On database ${name} you have almost exhausted the number of available IDs`,
                    advice: 'Change dbms.record_format to high_limit; see https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/#config_dbms.record_format for more details',
                }));
            } else {
                const pct = util.roundPct(count / THRESHOLD);

                findings.push(Advice.pass({
                    addr,
                    database: name,
                    finding: `Database ${name} has ${count} nodes, or ${pct}% of the threshold limit`,
                    advice: 'No action needed; see https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/#config_dbms.record_format for what this is about',
                }));
            }
        });
    });

    return findings;
};

export default [
    nodeStorage,
];