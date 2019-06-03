import InspectionResult from '../InspectionResult';
import _ from 'lodash';

const apocRule = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;

        if (_.get(node, 'basics.dbms.apoc')) {
            findings.push(new InspectionResult(InspectionResult.PASS, addr,
                'You are using APOC.  Good!',
                null, 'N/A'));
        } else {
            findings.push(new InspectionResult(InspectionResult.INFO, addr,
                'You are not using APOC', null,
                'Consider installing it to add features to your database! https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases'));
        }
    });

    return findings;
};

export default [
    apocRule,
];