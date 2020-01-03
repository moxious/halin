import React, { Component } from 'react';
import { Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import neo4j from '../../../../api/driver';

class ClusterMemberStatusIcon extends Component {
    state = {
        score: 1,
    };

    // Sampling feeds is needed to keep score updated in an ongoing way.
    sampleFeeds() {
        if (!this.mounted) { return null; }
        const score = this.props.member.getHealthScore(window.halinContext);
        this.setState(score);
    }

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.sampleFeeds(), 500);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    /*
     * A star icon is reserved for either:
     * - Neo4j < 4.0 leader machines, OR
     * - Neo4j >= 4.0 machines that are the leader for systemdb
     * The objective is to show only one star for any given cluster.  If a 
     * cluster is undergoing a leader election, there could be zero.
     * Non leaders get a circle, and read-replicas get a copy icon
     */
    render() {
        const canWriteSystem = this.props.member.canWrite(neo4j.SYSTEM_DB);
        const isSingleDBLeader = !this.props.member.supportsMultiDatabase() && this.props.member.isLeader();
        const isReplica = this.props.member.isReadReplica();

        const color = this.colorFor(this.state.score);

        let iconName;
        if (canWriteSystem || isSingleDBLeader) { iconName = 'star'; }
        else if (isReplica) { iconName = 'copy'; }
        else { iconName = 'circle'; }  // Follower

        return (
            <Icon className='ClusterMemberStatusIcon' name={iconName} color={color} />
        );
    }

    colorFor = (score) => {
        if (score >= 0.8) { return 'green'; }
        if (score >= 0.6) { return 'yellow'; }
        return 'red';
    };
}

ClusterMemberStatusIcon.props = {
    member: PropTypes.object.isRequired,
};

export default ClusterMemberStatusIcon;