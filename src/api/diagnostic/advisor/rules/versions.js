import Advice from '../Advice';
import _ from 'lodash';

const versionConsistency = pkg => {
    const findings = [];

    const neo4jVersionsFound = pkg.nodes
        .map(node => node.basics)
        .map(basics => _.get(basics, 'dbms.versions[0]'));

    // If all nodes are using the same version, this will only have
    // one entry.  If the different nodes in the cluster are running
    // different versions of Neo4j, we'll have more.
    const uniqueVersions = _.uniq(neo4jVersionsFound);
        
    if (uniqueVersions.length === 1) {
        findings.push(Advice.pass({
            finding: `All machines are running the same version of Neo4j, ${uniqueVersions[0]}`,
        }));
    } else {
        findings.push(Advice.error({
            finding: `Machines in your cluster are running different versions of Neo4j!
            Detected versions:  ${uniqueVersions.join(', ')}
            `,
            advice: 'Consider baselining all machines on one version.'
        }));
    }

    return findings;
};

export default [
    versionConsistency,
];