import React, { Component } from 'react';
import { Menu, Icon, Popup } from 'semantic-ui-react'
import util from '../../api/data/util.js';
import score from '../../api/cluster/health/score';

export default class ClusterMemberTabHeader extends Component {
    state = {
        score: 1,
        total: 1,
        fresh: 1,
        notFresh: 0,
        performance: { observations: [] },
    };

    sampleFeeds() {
        if (!this.mounted) { return null; } 
        const currentState = score.feedFreshness(window.halinContext, this.props.node);
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

    colorFor = (score) => {
        if (score >= 0.8) { return 'green'; }
        if (score >= 0.6) { return 'yellow'; }
        return 'red';
    };

    popupContent = () => {
        return (
            <div className='PopupContent'>
                <h4>Data</h4>
                <p>{`${this.state.fresh} of ${this.state.total} fresh`}</p>

                <p>{this.state.performance.observations.length} observations; mean response time 
                &nbsp;{util.roundToPlaces(this.state.performance.mean,0)}ms with a standard deviation of 
                &nbsp;{util.roundToPlaces(this.state.performance.stdev,0)}ms</p>

                <p>When most/all feeds are fresh, this indicates responsiveness.  When performance
                degrades, data feeds slow, stop, or error.</p>
            </div>
        );
    };

    isLeader = () => `${this.props.node.role}`.toLowerCase() === 'leader';
    isReadReplica = () => `${this.props.node.role}`.toLowerCase() === 'read_replica';

    statusIcon = () => {
        let iconName;
        if(this.isLeader()) { iconName = 'star'; }
        else if(this.isReadReplica()) { iconName = 'copy'; }
        else { iconName = 'circle'; }  // Follower

        const color = this.colorFor(this.state.score);

        return (
            <Icon name={iconName} color={color} />
        );
    }

    render() {
        const node = this.props.node;

        return (
            <Menu.Item>
                <Popup
                    key={node.getBoltAddress()}
                    trigger={this.statusIcon()} 
                    header={node.role}
                    content={this.popupContent()}
                    position='bottom left'
                />
                 
                <span style={{
                    fontWeight: this.isLeader() ? 'bold' : 'normal',
                }}>{ node.getLabel() }</span>
            </Menu.Item>
        );
    }
}