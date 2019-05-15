import React, { Component } from 'react';
import { Menu, Icon, Popup } from 'semantic-ui-react';

import score from '../../../../api/cluster/health/score';
import util from '../../../../api/data/util.js';

export default class ClusterMemberMenuItem extends Component {
    state = {
        currentState: null,
        score: 1,
        total: 1,
        fresh: 1,
        notFresh: 0,
        performance: { observations: [] },
    };

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

    sampleFeeds() {
        if (!this.mounted) { return null; }
        const currentState = score.feedFreshness(window.halinContext, this.props.member);
        this.setState(currentState);
    }

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.sampleFeeds(), 500);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    popupContent = () => {
        return (
            <div className='PopupContent'>
                <h4>Data</h4>
                <p>{`${this.state.fresh} of ${this.state.total} fresh`}</p>

                <p>{this.state.performance.observations.length} observations; mean response time
                &nbsp;{util.roundToPlaces(this.state.performance.mean, 0)}ms with a standard deviation of
                &nbsp;{util.roundToPlaces(this.state.performance.stdev, 0)}ms</p>

                <p>When most/all feeds are fresh, this indicates responsiveness.  When performance
                degrades, data feeds slow, stop, or error.</p>
            </div>
        );
    };

    render() {
        return (
            <Menu.Item as='a' 
                active={this.props.active} 
                onClick={() => this.props.onSelect(this.props.member, this)}>
                <Popup
                    key={this.props.member.getBoltAddress()}
                    trigger={this.statusIcon(this.props.member)}
                    header={this.props.member.role}
                    content={this.popupContent()}
                    position='bottom left'
                />
                {this.props.member.getLabel()}
            </Menu.Item>
        );
    }
}