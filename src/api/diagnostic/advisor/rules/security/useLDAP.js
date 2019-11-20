import metarule from '../metarule';
import Advice from '../../Advice';

// 2.3 Use Neo4j with an LDAP Auth Provider
// Description:
// Configuring Neo4j to use an LDAP Auth provider offloads management of 
// federated users to the LDAP service. The LDAP service facilities are used 
// for administration. 
// 
// Rationale:
// An LDAP auth provider provides stronger user management (disable users, 
// password changes, password complexity, etc.) than available with Neo4j 
// native users. It also streamlines the user management across a cluster, as 
// Neo4j does not centralize management of native users.
// 
// Remediation:
// The authentication mechanism should be implemented before anyone accesses 
// the Neo4j Server.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.security.auth_provider', (addr, authProvider, node) => {
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
    });
