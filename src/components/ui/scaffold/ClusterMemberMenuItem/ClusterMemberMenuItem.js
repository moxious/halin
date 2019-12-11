import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';

export default class ClusterMemberMenuItem extends Component {
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

    statusIcon = (member) => {
        const role = member.role.toLowerCase();

        let iconName;
        if (role === 'leader') { iconName = 'star'; }
        else if (role === 'read_replica') { iconName = 'copy'; }
        else { iconName = 'circle'; }  // Follower

        const color = this.colorFor(this.state.score);

        return (
            <Icon name={iconName} color={color} />
        );
    }

    colorFor = (score) => {
        if (score >= 0.8) { return 'green'; }
        if (score >= 0.6) { return 'yellow'; }
        return 'red';
    };

    render() {
        return (
            <Menu.Item as='a'
                active={this.props.active}
                onClick={() => this.props.onSelect(this.props.member, this)}>
                {this.statusIcon(this.props.member)}
                {this.props.member.getLabel()}
            </Menu.Item>
        );
    }
}