import InspectionResult from '../InspectionResult';
import _ from 'lodash';

const ports = pkg => {
    const findings = [];
    const expected = {
        'causal_clustering.discovery_advertised_address': '5000',
        'causal_clustering.discovery_listen_address': '5000',
        'causal_clustering.raft_advertised_address': '7000',
        'causal_clustering.raft_listen_address': '7000',
        'causal_clustering.transaction_advertised_address': '6000',
        'causal_clustering.transaction_listen_address': '6000',
        'dbms.backup.address': '6362',
        'dbms.connector.bolt.listen_address': '7687',
        'dbms.connector.http.listen_address': '7474',
        'dbms.connector.https.listen_address': '7473',
    };

    pkg.nodes.forEach(node => {
        const who = node.basics.address;

        Object.keys(expected).forEach(settingName => {
            const setting = node.configuration.filter(a => a.name === settingName);
            const val = _.get(setting, 'value') || '';
            const port = val.split(':')[1];

            if (port !== expected[setting]) {
                findings.push(new InspectionResult(InspectionResult.INFO, 
                    `The port configured for ${who} on ${setting} is ${port}, which is non-standard`,
                    null,
                    `Consider using the default port, ${expected[setting]} if firewall rules allow.`));
            }
        });
    });

    return findings;
};

const netAddrs = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const who = node.basics.address;

        const addr = node.configuration.filter(a => a.name === 'dbms.connectors.default_advertised_address')[0];
        const val = _.get(addr, 'value');

        if (val.match(/^10\.*/) || val.match(/^192\.168\.*/)) {
            findings.push(new InspectionResult(InspectionResult.WARN,
                `Your default_advertised_address on ${who} is an internal reserved IP address.
                 This configuration is likely to cause problems for other users on other networks`,
                 null, 'Set dbms.connectors.default_advertised_address to an externally valid IP or DNS name'));
        }
    });

    return findings;
};

export default [
    netAddrs, ports,
];