import Advice from '../Advice';
import _ from 'lodash';

// Helper function which checks a config option across all nodes in the package.
// Calls ruleFunction with addr, configValue, and node.
const mapNodeAndConfigOption = (pkg, configOption, adviceGenerator) =>
    pkg.nodes.map(node => {
        const val = node.configuration[configOption];
        const addr = node.basics.address;

        return adviceGenerator(addr, val, node);
    });

// 2.1 Ensure that authentication is enabled for Neo4j databases
// Description:
// This setting ensures that all clients, users, and/or servers are required to authenticate
// prior to being granted access to the Neo4j database.
// 
// Rationale:
// Failure to authenticate clients, users, and/or servers can enable unauthorized access to the
// Neo4j database and can prevent tracing actions back to their sources.
// 
// Remediation:
// The authentication mechanism should be implemented before anyone accesses the
// Neo4j Server.
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

// 2.3 Use Neo4j with an LDAP Auth Provider
// Description:
// Configuring Neo4j to use an LDAP Auth provider offloads management of federated users to the LDAP service. The LDAP service facilities are used for administration. 
// 
// Rationale:
// An LDAP auth provider provides stronger user management (disable users, password changes, password complexity, etc.) than available with Neo4j native users. It also streamlines the user management across a cluster, as Neo4j does not centralize management of native users.
// 
// Remediation:
// The authentication mechanism should be implemented before anyone accesses the
// Neo4j Server.
const useLDAP = pkg => {
    const adviceGenerator = (addr, authProvider, node) => {
        if (authProvider !== 'ldap') {
            return Advice.info({
                addr, 
                finding: 'You are not using an LDAP auth provider.',
                advice: `Consider using an LDAP provider.  
                    An LDAP auth provider provides stronger user management (disable users, 
                    password changes, password complexity, etc.) than available with Neo4j 
                    native users. It also streamlines the user management across a cluster, as 
                    Neo4j does not centralize management of native users.
                `,
            });
        }

        return Advice.pass({
            addr, finding: 'You are using the LDAP auth provider.  Good!',
        });
    };

    return mapNodeAndConfigOption(pkg, 'dbms.security.auth_provider', adviceGenerator);
};

// 2.5 Configure User Authentication Maximum Failed Attempts
// Description:
// When using Neo4j native user management, configure the maximum failed attempts to guard against brute force attacks.
// 
// Rationale:
// Configuring the maximum failed attempts will help minimize the chance of a successful brute force attack (avoid an attacker guessing a password by constantly requesting authentication to the server).
// 
// Remediation:
// In the Neo4j.conf file, add the dbms.security.auth_max_failed_attempts configuration parameter:
// 
// dbms.security.auth_max_failed_attempts=10
// 
// The default value for this parameter is 3.
const configureMaxFailedAttempts = pkg => {
    const adviceGenerator = (addr, maxFailedAttempts, node) => {
        if (maxFailedAttempts && maxFailedAttempts >= 3 && maxFailedAttempts <= 10) {
            return Advice.pass({
                addr,
                finding: 'You have a maximum number of failed user auth attempts configured.  Good!',
            });
        }

        return Advice.warn({
            addr,
            finding: `Your dbms.security.auth_max_failed_attempts is set to '${maxFailedAttempts}'`,
            advice: 'Set this to a value between 3 and 10 to minimize the chances of brute force password attack',
        });
    };

    return mapNodeAndConfigOption(pkg, 'dbms.security.auth_max_failed_attempts', adviceGenerator);
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
    overloading, authEnabled, useLDAP,
    configureMaxFailedAttempts,
];