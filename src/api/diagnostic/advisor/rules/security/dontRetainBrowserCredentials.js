import metarule from '../metarule';
import Advice from '../../Advice';

// 4.1 Ensure Neo4j Browser does not cache login information
// 
// Description:
// The Neo4j browser requires a username / password for login. This setting 
// ensures that all clients using the Neo4j browser are required to login 
// each time and that the login credentials are not maintained.
// 
// Rationale:
// Enforcing a login each time prevents unauthorized access to the Neo4j 
// database and provides traceability of database activities to a specific 
// user or component.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'browser.retain_connection_credentials', (addr, val, node) => {
        if(val === 'false') {
            return Advice.pass({ 
                addr,
                finding: 'Browser does not retain connection credentials, which is a secure configuration',
            });
        }

        return Advice.info({
            addr,
            finding: 'Neo4j browser retains connection credentials',
            advice: `Consider setting configuration browser.retain_connection_credentials=false for security;
            this will force users to log into browser each time they use it.`,
        });
    });
