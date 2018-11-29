import InspectionResult from '../InspectionResult';
import _ from 'lodash';

const atLeastOneAdmin = pkg => {
    const findings = [];
    pkg.nodes.forEach(node => {
        const addr = node.basics.address;
        const admins = node.users.filter(u => u.roles.indexOf('admin') > -1);
        if (admins.length === 0) {
            findings.push(new InspectionResult(
                InspectionResult.ERROR, addr,
                `Machine has no admin users`,
                'Ensure system has a user with role admin'
            ));
        } else {
            findings.push(new InspectionResult(
                InspectionResult.PASS, addr,
                `Machine has admin users specified`
            ));

            if (admins.length > 5) {
                findings.push(new InspectionResult(
                    InspectionResult.WARN, addr,
                    `Machine has a large number (${admins.length}) of users with admin privileges`,
                    'Periodically review permissions, and limit users to only the permissions they require'
                ));
            }
        }
    });

    return findings;
};

const userConsistency = pkg => {
    if(pkg.nodes.length === 1) {
        return [];
    }

    const findings = [];

    const userSets = {};
    const roleSets = {};

    pkg.nodes.forEach(node => {
        const addr = node.basics.address;
        const users = node.users.map(u => u.username);
        const roles = node.roles.map(r => r.role);

        console.log(addr, users, roles);

        userSets[addr] = new Set(users);
        roleSets[addr] = new Set(roles);
    });

    // Create union sets across all members to get a total
    // view of all users and roles across cluster, irrespective
    // of where they are.
    let allUnionUsers = new Set([]);
    let allUnionRoles = new Set([]);

    _.values(userSets).forEach(aSet => {
        const both = [...allUnionUsers].concat([...aSet]);
        allUnionUsers = new Set(both);
    });
    
    _.values(roleSets).forEach(aSet => {
        const both = [...allUnionRoles].concat([...aSet]);
        allUnionRoles = new Set(both);
    });
    
    console.log('ALL UNION USERS', [...allUnionUsers]);
    console.log('ALL UNION ROLES', [...allUnionRoles]);
    // Now, look through each cluster node and determine whether
    // a paricular node is falling short of the total set.
    const addrs = Object.keys(userSets);

    addrs.forEach(addr => {
        const users = userSets[addr];
        const roles = roleSets[addr];

        const userDifference = new Set(
            [...allUnionUsers].filter(x => !users.has(x))
        );

        const roleDifference = new Set(
            [...allUnionRoles].filter(x => !roles.has(x))
        );

        if(userDifference.size > 0) {
            const diff = [...userDifference].join(', ');
            findings.push(new InspectionResult(
                InspectionResult.ERROR, addr,
                `Machine is missing users ${diff} which are defined elsewhere in the cluster`,
                'Consider creating the appropriate users to sync them across the cluster'
            ));
        } else {
            findings.push(new InspectionResult(
                InspectionResult.PASS, addr,
                `Machine has a consistent user set`
            ));
        }

        if (roleDifference.size > 0) {
            const diff = [...roleDifference].join(', ');
            findings.push(new InspectionResult(
                InspectionResult.ERROR, addr,
                `Machine is missing roles ${diff} which are defined elsewhere in the cluster`,
                'Consider creating the appropriate roles to sync them across the cluster'
            ));
        } else {
            findings.push(new InspectionResult(
                InspectionResult.PASS, addr,
                `Machine has a consistent role set`
            ));
        }
    });
    
    return findings;
};

export default [
    userConsistency, atLeastOneAdmin,
];