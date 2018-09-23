import InspectionResult from '../InspectionResult';
import _ from 'lodash';

const overloading = pkg => {
    const findings = [];

    pkg.nodes.forEach(node => {
        const settings = Object.keys(node.configuration);
        let overloaded = false;
        const addr = node.basics.address;
        
        settings.forEach(setting => {
            const val = node.configuration[setting];
            if (_.isArray(val)) {
                const n = val.length;
                overloaded = true;
                findings.push(new InspectionResult(InspectionResult.ERROR, addr,
                    `Configuration item ${setting} has ${n} values specified`,
                    'Entries should exist in the configuration file only once. Edit your configuration to ensure it is correct'));
            }
        });

        // PENDING / TODO
        // If users have overloaded config, like this:
        // dbms.auth.enabled=true
        // dbms.auth.enabled=false
        //
        // Then the DB doesn't fully report that to us.  So this module doesn't exactly do what
        // it's supposed to right now because neo4j isn't storing its own config correctly.
        //
        // if (!overloaded) {
        //     findings.push(new InspectionResult(InspectionResult.PASS, addr,
        //         'No overloaded configuration items found.  Good!'));
        // }
    });

    return findings;
};

export default [
    overloading,
];