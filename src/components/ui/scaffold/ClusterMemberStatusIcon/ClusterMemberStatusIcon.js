import React, { Component } from 'react';
import { Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';

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

    render() {
        const role = this.props.member.role.toLowerCase();
        const color = this.colorFor(this.state.score);

        let iconName;
        if (role === 'leader') { iconName = 'star'; }
        else if (role === 'read_replica') { iconName = 'copy'; }
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