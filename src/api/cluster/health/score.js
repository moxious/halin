/*
 * Functions which take a ClusterMember as an argument, and return a score from 0 - 100
 * based on how "healthy" the node appears to be.
 * 
 * 1 is defined as everything is perfect as far as we can tell.
 * 0 is defined as we are sure this node is dead/absent/not responsive.
 * 
 * The meaning of intermediate values depends on the measurement approach.
 */

/**
 * Determine a health score by checking feed freshness. 
 * @param {HalinContext} ctx
 * @param {ClusterMember} member
 * @returns {Object} with a score member.
 */
const feedFreshness = (ctx, member) => {
    const feeds = ctx.getFeedsFor(member).map(feed => feed.isFresh());

    const total = feeds.length;
    const fresh = feeds.filter(f => f).length;
    const notFresh = feeds.filter(f => !f).length;

    return {
        score: fresh / total,
        total,
        fresh,
        notFresh,
        performance: member.performance(),
        created: new Date(),
    };
};

export default {
    feedFreshness,
};