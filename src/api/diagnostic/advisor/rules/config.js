import Advice from '../Advice';
import _ from 'lodash';

const overloading = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const settings = Object.keys(node.configuration);
        // let overloaded = false;
        const addr = node.basics.address;
        
        settings.forEach(setting => {
            const val = node.configuration[setting];
            if (_.isArray(val)) {
                const n = val.length;
                // overloaded = true;
                findings.push(Advice.error({
                    addr,
                    finding: `Configuration item ${setting} has ${n} values specified`, 
                    advice: 'Entries should exist in the configuration file only once. Edit your configuration to ensure it is correct',
                }));
            }
        });
    });

    return findings;
};

export default [
    overloading,
];