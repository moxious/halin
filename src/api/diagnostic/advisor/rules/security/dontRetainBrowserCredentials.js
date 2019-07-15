import metarule from '../metarule';
import Advice from '../../Advice';

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
