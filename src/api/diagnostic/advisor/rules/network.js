import Advice from '../Advice';
import metarule from './metarule';

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

            if (val === undefined) {
                // Undefined counts as default.
                return;
            }

            const port = val.split(':')[1] || 'unknown';

            if (port !== expected[settingName]) {
                findings.push(Advice.info({
                    addr: who,
                    finding: `The port configured for ${settingName} is ${port}, which is non-standard`,
                    advice: `Consider using the default port, ${expected[settingName]} if firewall rules allow.`,
                }));
                looksGood = false;
            }
        });

        if (looksGood) {
            findings.push(Advice.pass({
                addr: who, finding: 'Network port settings look good!',
            }));
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
            findings.push(Advice.warn({
                addr: who,
                finding: `Your default_advertised_address is an internal reserved IP address.
                 This configuration is likely to cause problems for other users on other networks`,
                advice: 'Set dbms.connectors.default_advertised_address to an externally valid IP or DNS name',
            }));
        }
    });

    return findings;
};

const backup = metarule.enterpriseOnlyRule(pkg => {
    const findings = [];

    const isBackupEnabled = node => {
        const val = node.configuration['dbms.backup.enabled'];
        return val && (val==='true' || val === true);
    };

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;

        if (isBackupEnabled(node)) {
            const backupAddr = '' + node.configuration['dbms.backup.address'];

            if(backupAddr.match(/(localhost|127\.0\.0\.1)/i)) {
                findings.push(Advice.pass({
                    addr,
                    finding: 'Backups are enabled, but only on localhost.',
                }));
            } else {
                findings.push(Advice.warn({
                    addr,
                    finding: `You have backups enabled on a remote network device or address (${backupAddr}).`,
                    advice: `For best security, please ensure you have proper firewalling 
                    to allow ony authorized parties to access your backup address`,
                }));
            }
        } else {
            findings.push(Advice.info({
                addr, 
                finding: 'Backup is not enabled on this machine',
                advice: 'Consider using backup when moving to production',
            }));
        }
    });

    return findings;
});

export default [
    netAddrs, ports, backup,
];