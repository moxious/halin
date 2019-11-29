import SyntheticDataFeed from "./SyntheticDataFeed";
import api from '../../../api';
import _ from 'lodash';

/**
 * Class represents cluster utilization at one snapshot moment in time.
 */
class ClusterUtilization {
    constructor(maxHeap) {
        this.maxHeap = maxHeap;
        this.leader = null;
        this.followers = [];
    }
    
    utilization(obj) {
        const heapUsed = _.get(obj.state, 'heapUsed') || -1;
        const maxHeap = obj.maxHeap || -1;
    
        let utilization = heapUsed / maxHeap;
        let availability = 1 - utilization;
        
        if (heapUsed === -1 || maxHeap === -1) {
            utilization = 1.0;
            availability = 0.0;
        }

        return _.merge({ utilization, availability }, obj);
    }

    addLeader({ member, state }) {
        const o = { 
            member,
            state: _.isArray(state) ? state[state.length-1] : state,
            maxHeap: member.getMaxHeap(),
        };

        this.leader = this.utilization(o);
    }

    addFollower({ member, state, }) {
        const o = { 
            member, 
            state: _.isArray(state) ? state[state.length-1] : state,
            maxHeap: member.getMaxHeap(),
        };

        this.followers.push(this.utilization(o));
    }

    calculate() {
        // All known read-availabilities, substituting -1 when it's unknown.
        let readAvails = this.followers
            .map(f => _.get(f, 'availability') || -1)
            .filter(x => x !== -1);

        if (readAvails.length === 0) { 
            readAvails = [0];
        }
        const write = {
            availability: _.get(this.leader, 'availability') || 0,
        };

        const read = { 
            best: Math.max(...readAvails),
            worst: Math.min(...readAvails),            
        };

        read.availability = read.worst;

        // console.log('leader followers', this.leader, this.followers);
        return { read, write };
    }
}

export default class UtilizationFeed extends SyntheticDataFeed {
    constructor(halin) {
        super();
        this.halin = halin;
        const feeds = this.findFeeds();

        if (feeds.length === 0) {
            throw new Error('No feeds found');
        }

        this.state = {};
        this.initialize(feeds);
    }

    findFeeds() {
        return this.halin.members().map(member => {
            const memberFeeds = this.halin.getFeedsFor(member);
            const feed = memberFeeds.filter(f => f.query === api.queryLibrary.JMX_MEMORY_STATS.query)[0];

            if (!feed) {
                api.sentry.warn(`No JMX memory feed for ${member.getLabel()}`);
                return null;
            }

            return feed;
        }).filter(x => x);
    }

    getLeaderState() {
        for (let i = 0; i < this.dataFeeds.length; i++) {
            const feed = this.dataFeeds[i];

            if (feed.member().isLeader()) {
                return {
                    member: feed.member(),
                    state: this.accumulator[feed.name].toArray().map(e => e._original),
                };
            }
        }

        return null;
    }

    getFollowerState() {
        return this.dataFeeds.map(feed =>
            feed.member().isFollower() ? {
                member: feed.member(),
                state: this.accumulator[feed.name].toArray().map(e => e._original),
            } : null).filter(x => x);
    }

    getCalculatedState() {
        return this.state;
    }

    /**
     * Called whenever any of the constituent feeds updates us with data.
     */
    onUpdate() {
        const ut = new ClusterUtilization();
        ut.addLeader(this.getLeaderState());
        this.getFollowerState().forEach(fs => ut.addFollower(fs));
        this.state = ut.calculate();
        this.notifyListeners();
    }
};