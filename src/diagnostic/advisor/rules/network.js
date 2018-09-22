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
            const setting = node.configuration.filter(a => a.name === settingName);
            const val = _.get(setting, 'value') || '';
            const port = val.split(':')[1];

            if (port !== expected[setting]) {
                findings.push(new InspectionResult(InspectionResult.INFO, 
                    who,
                    `The port configured for ${setting} is ${port}, which is non-standard`,
                    null,
                    `Consider using the default port, ${expected[setting]} if firewall rules allow.`));
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

        const addr = node.configuration.filter(a => a.name === 'dbms.connectors.default_advertised_address')[0];
        const val = _.get(addr, 'value');

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

    const getBackupAddr = node => {
        const config = node.configuration
            .filter(a => (a.name === 'dbms.backup.address'))[0];
        return _.get(config, 'value');
    };

    const isBackupEnabled = node => {
        const setting = node.configuration
            .filter(a => (a.name === 'dbms.backup.enabled'))[0];
        return setting && (setting.value==='true' || setting.value === true);
    };

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;

        if (isBackupEnabled(node)) {
            const backupAddr = getBackupAddr(node);

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