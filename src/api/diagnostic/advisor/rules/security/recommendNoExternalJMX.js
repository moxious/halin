import metarule from '../metarule';
import Advice from '../../Advice';

export default (pkg) =>
    metarule.forConfigOption(pkg, 'dbms.jvm.additional', (addr, val, node) => {
        if (val && val.indexOf('com.sun.management.jmxremote.port') > -1) {
            return Advice.warn({
                addr,
                finding: `A remote JMX port is configured in ${val}`,
                advice: 'Consider disabling remote JMX access to Neo4j and using a different monitoring method for security',
            });
        }

        return Advice.pass({
            addr,
            finding: 'Remote JMX access looks like it is not enabled.  Good!',
        });
    });
