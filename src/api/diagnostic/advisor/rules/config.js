import Advice from '../Advice';
import _ from 'lodash';

const authEnabled = pkg => {
    const findings = [];

    const k = 'dbms.security.auth_enabled';

    pkg.nodes.forEach(node => {        
        const addr = node.basics.address;
        const authEnabled = node.configuration[k];
        // console.log(authEnabled);

        if (_.isNil(authEnabled)) {
            findings.push(Advice.info({ 
                addr, 
                finding: `Auth enabled configuration is missing (${k}) but it defaults to true`,
                advice: 'Consider setting this to true explicitly in your configuration file.',
            }));
        } else if (authEnabled === 'false') {
            findings.push(Advice.error({
                addr, 
                finding: `Database authorization is disabled (${k}=false)`,
                advice: 'You should enable database authorization; this configuration makes the database vulnerable to malicious activities. Disabling authentication and authorization is not recommended',
            }));
        } else if (authEnabled === 'true') {
            findings.push(Advice.pass({
                addr,
                finding: 'Database authentication and authorization support is enabled',
            }));
        } else {
            findings.push(Advice.error({
                addr, 
                finding: `Configuration parameter ${k} has an invalid value`,
                advice: 'You should set this parameter to true',
            }));
        }
    });

    return findings;
};

const overloading = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const settings = Object.keys(node.configuration);
        // let overloaded = false;
        const addr = node.basics.address;
        
        settings.forEach(setting => {
            const val = node.configuration[setting];
            if (_.isArray(val)) {
                const n = val.length;
                // overloaded = true;
                findings.push(Advice.error({
                    addr,
                    finding: `Configuration item ${setting} has ${n} values specified`, 
                    advice: 'Entries should exist in the configuration file only once. Edit your configuration to ensure it is correct',
                }));
            }
        });
    });

    return findings;
};

export default [
    overloading, authEnabled,
];