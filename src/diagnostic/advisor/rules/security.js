import InspectionResult from '../InspectionResult';
import _ from 'lodash';

const browserCredentials = pkg => {
    const findings = [];
 
    pkg.nodes.forEach(node => {        
        const addr = node.basics.address;

        if (node.configuration['browser.retain_connection_credentials'] === 'false') {
            findings.push(new InspectionResult(InspectionResult.PASS, addr,
                'Browser does not retain connection credentials, which is a secure configuration'));
        } else {
            findings.push(new InspectionResult(InspectionResult.INFO, addr,
                'Neo4j browser retains connection credentials', null,
                `Consider setting configuration browser.retain_connection_credentials=false for security;
                this will force users to log into browser each time they use it.`));
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
            findings.push(new InspectionResult(InspectionResult.WARN, addr,
                `A remote JMX port is configured in ${k}`,
                null,
                'Consider disabling remote JMX access to Neo4j and using a different monitoring method for security'));
        } else {
            findings.push(new InspectionResult(InspectionResult.PASS, addr,
                'Remote JMX access looks like it is not enabled, which is good'));
        }
    });

    return findings;
};

export default [
    noExternalJMX,
    browserCredentials,
];