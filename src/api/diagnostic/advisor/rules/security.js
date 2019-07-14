import Advice from '../Advice';

const browserCredentials = pkg => {
    const findings = [];
 
    pkg.nodes.forEach(node => {        
        const addr = node.basics.address;

        if (node.configuration['browser.retain_connection_credentials'] === 'false') {
            findings.push(Advice.pass({ 
                addr,
                finding: 'Browser does not retain connection credentials, which is a secure configuration',
            }));
        } else {
            findings.push(Advice.info({
                addr,
                finding: 'Neo4j browser retains connection credentials',
                advice: `Consider setting configuration browser.retain_connection_credentials=false for security;
                this will force users to log into browser each time they use it.`,
            }));
        }
    });

    return findings;
};

const noExternalJMX = pkg => {
    const findings = [];

    const k = 'dbms.jvm.additional';

    pkg.nodes.forEach(node => {        
        const addr = node.basics.address;
        const jvmAdditional = node.configuration[k];

        if (jvmAdditional && jvmAdditional.indexOf('com.sun.management.jmxremote.port') > -1) {
            findings.push(Advice.warn({
                addr,
                finding: `A remote JMX port is configured in ${k}`,
                advice: 'Consider disabling remote JMX access to Neo4j and using a different monitoring method for security',
            }));
        } else {
            findings.push(Advice.pass({
                addr,
                finding: 'Remote JMX access looks like it is not enabled, which is good',
            }));
        }
    });

    return findings;
};

export default [
    noExternalJMX,
    browserCredentials,
];