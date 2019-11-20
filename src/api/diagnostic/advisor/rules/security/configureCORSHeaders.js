import metarule from '../metarule';
import Advice from '../../Advice';

// 4.3 Configure CORS Headers

// Description:
// The Access-Control-Allow-Origin response header indicates whether the response can be shared with resources with the given origin. For requests without credentials, the server may specify "*" as a wildcard, thereby allowing any origin to access the resource. 

// It may be necessary to specify the CORS response header to limit access to a specific URI. 

// Rationale:
// Enabling a specific CORS response header limits the ability to access the website.
export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.security.http_access_control_allow_origin', (addr, val, node) => {
        if(!val || val === '*') {
            return Advice.info({
                addr,
                finding: 'Configure CORS Headers',
                advice: `
                 Enabling a specific CORS response header 
                 (dbms.security.http_access_control_allow_origin) limits the ability to 
                 access the website
                `,
            })
        }

        return Advice.pass({
            addr,
            finding: 'You have CORS headers configured.  Good!',
        });
    });
