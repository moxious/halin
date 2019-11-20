import metarule from '../metarule';
import Advice from '../../Advice';

// 4.4 Set HTTP Strict-Transport-Security (HSTS) Response Header

// Description:
// The HTTP Strict-Transport-Security (HSTS) header tells browsers that a webpage should only be accessed using HTTPS instead of HTTP. It is attached to every HTTPS response. 

// Rationale:
// Enabling the HSTS Response Header ensures that the browser is only available via HTTPS.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.security.http_strict_transport_security', (addr, val, node) => {
        if(!val) {
            return Advice.info({
                addr,
                finding: 'Set HTTP Strict-Transport-Security (HSTS) Response Header',
                advice: `
                The HTTP Strict-Transport-Security (HSTS) header tells browsers that a 
                webpage should only be accessed using HTTPS instead of HTTP. It is 
                attached to every HTTPS response. Enabling the HSTS Response 
                Header ensures that the browser is only available via HTTPS.                
                `,
            })
        }

        return Advice.pass({
            addr,
            finding: 'You have HTTP Strict-Transport-Security (HSTS) Response headers configured.  Good!',
        });
    });
