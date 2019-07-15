import metarule from '../metarule';
import Advice from '../../Advice';

export default (pkg) => 
    metarule.forConfigOption(pkg, 'dbms.connector.http.enabled', (addr, val, node) => (
        val === 'false' ? 
        Advice.pass({ addr, finding: 'You have disabled HTTP access.  Good!' }) : 
        Advice.info({ 
            addr,
            finding: 'You have HTTP enabled (dbms.connector.http.enabled=true)',
            advice: 'Disable HTTP and prefer the use of HTTPS because it encrypts traffic in transit'
        })
    ));
