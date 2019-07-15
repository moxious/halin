import metarule from '../metarule';
import Advice from '../../Advice';

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
export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.security.auth_max_failed_attempts', (addr, maxFailedAttempts, node) => {
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
    });
