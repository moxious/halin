import InspectionResult from '../InspectionResult';

const logRetention = pkg => {
    const findings = [];
 
    pkg.nodes.forEach(node => {        
        const addr = node.basics.address;
        const val = node.configuration['dbms.tx_log.rotation.retention_policy'];

        if (!val || val === '7 days') {
            findings.push(new InspectionResult(InspectionResult.WARN, addr,
                    `The log rotation policy is set to the default; TX logs can become
                    large, and this may contribute to full disk errors.

                    Generally speaking, you should set this parameter to slightly larger than the 
                    interval for incremental backups. If their schedule is a full backup on 
                    Sunday and incrementals Monday-Saturday, so as to support incremental 
                    backup we really only need to set this parameter to 1 days, or for 
                    extra safety for if/when an incremental fails set it to 2 days
                    `,
                    'Consult https://neo4j.com/docs/operations-manual/3.5/configuration/transaction-logs/ for more information',
                ));
        } else {
            findings.push(new InspectionResult(InspectionResult.PASS, addr,
                'You have customized the default transaction log retention policy. That\'s good!'));
        }
    });

    return findings;
};

export default [
    logRetention,
];