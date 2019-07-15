import metarule from '../metarule';
import Advice from '../../Advice';

// 3.1 Require TLS for Bolt Connections
// dbms_connector_bolt_tls_level=REQUIRED
// 
// Rationale:
// The bolt protocol can operate either encrypted or unencrypted. This setting ensures that unencrypted mode may not be used by clients. This in turn ensures that unencrypted data and authorization information never crosses the wire.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.connector.bolt.tls_level', (addr, val, node) => {
        if (val === 'REQUIRED') {
            return Advice.pass({
                addr, finding: 'You have configured TLS to be required for bolt connections.  Good!',
            });
        }

        return Advice.info({
            addr, finding: `You have configured TLS for bolt connections to be ${val}`,
            advice: `
            Recommend this be set to REQUIRED.  The bolt protocol can operate either 
            encrypted or unencrypted. 
            This setting ensures that unencrypted mode may not be used by clients. 
            This in turn ensures that unencrypted data and authorization information 
            never crosses the wire.
            `,
        });
    });
