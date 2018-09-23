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
        let looksGood = true;

        Object.keys(expected).forEach(settingName => {
            const val = node.configuration[settingName];
            const port = val.split(':')[1];

            if (port !== expected[settingName]) {
                findings.push(new InspectionResult(InspectionResult.INFO, 
                    who,
                    `The port configured for ${settingName} is ${port}, which is non-standard`,
                    null,
                    `Consider using the default port, ${expected[settingName]} if firewall rules allow.`));
                looksGood = false;
            }
        });

        if (looksGood) {
            findings.push(new InspectionResult(InspectionResult.PASS,
                who, `Network port settings look good!`));
        }
    });

    return findings;
};

const netAddrs = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const who = node.basics.address;

        const val = node.configuration['dbms.connectors.default_advertised_address'];

        if (val.match(/^10\.*/) || val.match(/^192\.168\.*/)) {
            findings.push(new InspectionResult(InspectionResult.WARN,
                who,
                `Your default_advertised_address is an internal reserved IP address.
                 This configuration is likely to cause problems for other users on other networks`,
                 null, 'Set dbms.connectors.default_advertised_address to an externally valid IP or DNS name'));
        }
    });

    return findings;
};

const backup = pkg => {
    const findings = [];

    const isBackupEnabled = node => {
        const val = node.configuration['dbms.backup.enabled'];
        return val && (val==='true' || val === true);
    };

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;

        if (isBackupEnabled(node)) {
            const backupAddr = node.configuration['dbms.backup.address'];

            if((''+backupAddr).toLowerCase().indexOf('localhost') > -1) {
                findings.push(new InspectionResult(InspectionResult.PASS,
                    addr,
                    'Backups are enabled, but only on localhost.'));
            } else {
                findings.push(new InspectionResult(InspectionResult.WARN,
                    addr,
                    `You have backups enabled on a remote address (${backupAddr}).`,
                    `For best security, please ensure you have proper firewalling 
                    to allow ony authorized parties to access your backup address`));
            }
        } else {
            findings.push(new InspectionResult(InspectionResult.INFO,
                addr, 
                'Backup is not enabled on this machine',
                'Consider using backup when moving to production'));
        }
    });

    return findings;
};

export default [
    netAddrs, ports, backup,
];