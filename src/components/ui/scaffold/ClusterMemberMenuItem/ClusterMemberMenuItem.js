import React, { Component } from 'react';
import { Menu, Icon, Popup, Grid } from 'semantic-ui-react';

import score from '../../../../api/cluster/health/score';
import util from '../../../../api/data/util.js';

import SignalMeter from '../../../data/SignalMeter/SignalMeter';

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
                <Grid>
                    <Grid.Column width={2}>
                        <SignalMeter strength={util.signalStrengthFromFreshRatio(this.state.fresh, this.state.total)} />
                    </Grid.Column>
                    <Grid.Column width={14}>
                        <p>{`${this.state.fresh} of ${this.state.total} fresh`};&nbsp;
                            {this.state.performance.observations.length} observations; mean response 
                            &nbsp;{util.roundToPlaces(this.state.performance.mean, 0)}ms with stdev {util.roundToPlaces(this.state.performance.stdev, 0)}ms</p>
                    </Grid.Column>
                </Grid>
            </div>
        );
    };

    render() {
        return (
            <Popup
                inverted
                position='right center'
                wide='very'
                key={this.props.member.getBoltAddress()}
                trigger={
                    <Menu.Item as='a'
                        active={this.props.active}
                        onClick={() => this.props.onSelect(this.props.member, this)}>
                        {this.statusIcon(this.props.member)}
                        {this.props.member.getLabel()}
                    </Menu.Item>
                }
                header={`Role: ${this.props.member.role}`}
                content={this.popupContent()}
            />

        );
    }
}