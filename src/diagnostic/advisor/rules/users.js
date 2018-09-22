import InspectionResult from '../InspectionResult';

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

        userSets[addr] = new Set(...users);
        roleSets[addr] = new Set(...roles);
    });

    // Create union sets across all members to get a total
    // view of all users and roles across cluster, irrespective
    // of where they are.
    let allUnionUsers = new Set([]);
    let allUnionRoles = new Set([]);

    Object.values(userSets).map(aSet => {
        allUnionUsers = new Set([...allUnionUsers, ...aSet]);
    });
    
    Object.values(roleSets).map(aSet => {
        allUnionRoles = new Set([...allUnionRoles, ...aSet]);
    });
    
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
                InspectionResult.ERROR,
                `Node ${addr} is missing users ${diff} which are defined elsewhere in the cluster`,
                'Consider creating the appropriate users to sync them across the cluster'
            ));
        }

        if (roleDifference.size > 0) {
            const diff = [...roleDifference].join(', ');
            findings.push(new InspectionResult(
                InspectionResult.ERROR,
                `Node ${addr} is missing roles ${diff} which are defined elsewhere in the cluster`,
                'Consider creating the appropriate roles to sync them across the cluster'
            ));
        }
    });
    
    return findings;
};

export default [
    userConsistency,
];