import metarule from '../metarule';
import Advice from '../../Advice';
import _ from 'lodash';

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
const k = 'dbms.security.auth_enabled';

export default (pkg) =>
    metarule.forConfigOption(pkg, k, (addr, authEnabled, node) => {
        if (_.isNil(authEnabled)) {
            return Advice.info({
                addr,
                finding: `Auth enabled configuration is missing (${k}) but it defaults to true`,
                advice: 'Consider setting this to true explicitly in your configuration file.',
            });
        } else if (authEnabled === 'false') {
            return Advice.error({
                addr,
                finding: `Database authorization is disabled (${k}=false)`,
                advice: 'You should enable database authorization; this configuration makes the database vulnerable to malicious activities. Disabling authentication and authorization is not recommended',
            });
        } else if (authEnabled === 'true') {
            return Advice.pass({
                addr,
                finding: 'Database authentication and authorization support is enabled',
            });
        }

        return Advice.error({
            addr,
            finding: `Configuration parameter ${k} has an invalid value`,
            advice: 'You should set this parameter to true',
        });
    });
