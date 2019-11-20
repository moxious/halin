import metarule from '../metarule';
import Advice from '../../Advice';

// 2.6 Configure User Authentication Lockout Time
// Description:
// When using Neo4j native user management, configure the user lockout time after 
// unsuccessful authentication attempts to guard against brute force attacks.
// 
// Rationale:
// Configuring the user lockout time will help minimize the chance of a successful brute 
// force attack (avoid an attacker guessing a password by constantly requesting 
// authentication to the server).
// 
// Remediation:
// In the Neo4j.conf file, add the dbms.security.auth_lock_time configuration parameter:
// 
// dbms.security.auth_lock_time=10
// 
// The default value for this parameter is 5. The unit of measure for this 
// parameter is seconds.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.security.auth_lock_time', (addr, val, node) => {
        if (!val || val > 10 || val < 3) {
            return Advice.info({
                addr, 
                finding: `Your dbms.security.auth_lock_time is set to ${val}`,
                advice: `Recommend setting this to a value between 3 and 10 to 
                minimize the chances of a successful brute force attack`,
            });
        }

        return Advice.pass({
            addr, 
            finding: 'Your dbms.security.auth_lock_time is appropriately configured',
        });
    });
