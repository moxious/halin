import InspectionResult from '../InspectionResult';
import _ from 'lodash';

/**
 * Imagine transaction updates in a cluster as a race, everyone trying to keep up with the 
 * leader.  A race chart is just a data structure that identifies who the leader is, and who
 * is even with the leader, and who is behind.  It lets us diagnose issues associated with 
 * slow or lack of transaction replication in the cluster.
 * @param {*} pkg diagnostic package
 * @returns Object { leader, even, behind, ahead } 
 */
const makeRaceChart = pkg => {
    // Centralize access to this property in the diagnostic package
    const getLastTXID = node => _.get(node, 'lastTXID.value') || 0;

    const writeMember = pkg.nodes.filter(n => n.basics.writer)[0] || pkg.nodes[0];
    const leadingValue = getLastTXID(writeMember);

    const restMembers = pkg.nodes.filter(m => m !== writeMember);

    const makeRaceChartEntry = member => ({
        member,
        value: getLastTXID(member),
        laggingBy: leadingValue - getLastTXID(member),
    });

    // Those members that are "even" or caught up are those whose last TX ID
    // matches the leaders.
    const even = restMembers.filter(m => getLastTXID(m) === leadingValue)
        .map(makeRaceChartEntry);
    
    // Anybody else is behind.
    const behind = restMembers.filter(m => getLastTXID(m) < leadingValue)
        .map(makeRaceChartEntry);

    // This should never happen but we're checking in case assumptions get violated.
    const ahead = restMembers.filter(m => getLastTXID(m) > leadingValue)
        .map(makeRaceChartEntry);


    return {
        leader: makeRaceChartEntry(writeMember),
        even,
        behind,
        ahead,
    };
};

const transactionGapRule = pkg => {
    const findings = [];

    // There's no race, and no possible gap in single-node clusters.
    if (pkg.nodes.length === 1) {
        findings.push(new InspectionResult(InspectionResult.PASS, 'overall',
            'All cluster members are even in transaction replication', null, 'N/A'));
        return findings;
    }

    const chart = makeRaceChart(pkg);
    // console.log('CHART', chart);

    const memb = chart.leader;
    const leadAddr = memb.member.basics.address;
    const leadValue = memb.value;

    // Identify the lead value.
    findings.push(new InspectionResult(InspectionResult.INFO, leadAddr,
        `Last Transaction ID is ${leadValue}`, null, 'N/A'));

    chart.even.forEach(entry => {
        console.log('EVEN', entry);
        findings.push(new InspectionResult(InspectionResult.PASS, entry.member.basics.address,
            `This member is even with transaction replication at TXID ${leadValue}. Good!`, 
            null, 'N/A'));
    });

    chart.behind.forEach(entry => {
        const LAG_THRESHOLD = 20;
        const addr = entry.member.basics.address;

        const level = entry.laggingBy >= LAG_THRESHOLD ? InspectionResult.ERROR : InspectionResult.WARN;

        findings.push(new InspectionResult(level, addr,
            `This member is lagging the leader by ${entry.laggingBy} transactions`,
            `Small amounts of lag indicate regular cluster replication; larger amounts may indicate
            a network or configuration problem, and may result in stale data on querying this member`,
            'N/A'));
    });

    chart.ahead.forEach(entry => {
        const addr = entry.member.basics.address;
        findings.push(new InspectionResult(InspectionResult.ERROR, addr,
            `This member is ahead of the leader by ${-1 * entry.laggingBy} transactions`,
            `This should never occur.  Either Halin has incorrectly determined the cluster leader,
            or your database is misconfigured.  This should be investigated.`,
            'N/A'));
    });

    return findings;
};

export default [
    transactionGapRule,
];