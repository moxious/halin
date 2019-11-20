import Advice from '../Advice';
import _ from 'lodash';

const apocRule = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;

        if (_.get(node, 'basics.dbms.apoc')) {
            findings.push(Advice.pass({
                addr,
                finding: 'You are using APOC.  Good!',
            }));
        } else {
            findings.push(Advice.info({
                addr,
                finding: 'You are not using APOC',
                advice: 'Consider installing it to add features to your database! https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases',
            }));
        }
    });

    return findings;
};

export default [
    apocRule,
];