import metarule from '../metarule';
import Advice from '../../Advice';

// 4.2 Implement Neo4j Browser Time-Out
// 
// Description:
// The Neo4j browser requires a username / password for login. This setting 
// ensures that a client using the Neo4j browser will be logged out after a
// period of inactivity. 
// 
// Rationale:
// Enforcing a time-out after a period of inactivity prevents unauthorized 
// access to the Neo4j database.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'browser.credential_timeout', (addr, val, node) => {
        if(val) {
            return Advice.pass({ 
                addr,
                finding: 'Browser credential timeouts are configured, which is good!',
            });
        }

        return Advice.info({
            addr,
            finding: 'Implement Neo4j browser credential timeouts',
            advice: `
                Recommend setting browser.credential_timeout=15m.  This setting ensures 
                that a client using the Neo4j browser will be logged out after 
                a period of inactivity.
            `,
        });
    });
