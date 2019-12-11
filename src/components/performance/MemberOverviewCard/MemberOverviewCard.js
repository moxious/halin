import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import { List, Grid } from 'semantic-ui-react';
import util from '../../../api/data/util.js';

import SignalMeter from '../../data/SignalMeter/SignalMeter';

class MemberOverviewCard extends Component {
    state = {
        currentState: null,
        score: 1,
        total: 1,
        fresh: 1,
        notFresh: 0,
        performance: { observations: [] },
    };

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
        const roles = this.props.member.getDatabaseRoles();
        const databases = Object.keys(roles);
        databases.sort();

        return (
            <HalinCard owner={this}>
                <h3>Member Overview</h3>

                <List style={{ textAlign: 'left' }}>
                    {databases.map((dbName, k) =>
                        <List.Item key={k}>
                            <strong>{dbName}</strong>: {roles[dbName]}
                        </List.Item>)}
                </List>

                <List style={{ textAlign: 'left' }}>
                    <List.Item>
                        <List.Icon name='tags' />
                        <List.Content>{this.props.member.id}</List.Content>
                    </List.Item>

                    {this.props.member.groups && this.props.member.groups.length > 0 ? <List.Item>
                        <List.Icon name='group' />
                        <List.Content>{this.props.member.groups}</List.Content>
                    </List.Item> : ''}

                    <List.Item>
                        <List.Icon name='address book' />
                        <List.Content>{this.props.member.addresses.join(', ')}</List.Content>
                    </List.Item>
                </List>

                <Grid>
                    <Grid.Row>
                        <Grid.Column width={2}>
                            <SignalMeter strength={util.signalStrengthFromFreshRatio(this.state.fresh, this.state.total)} />
                        </Grid.Column>
                        <Grid.Column width={14}>
                            <p>{`${this.state.fresh} of ${this.state.total} fresh`};&nbsp;
                                {this.state.performance.observations.length} observations; mean response
                                &nbsp;{util.roundToPlaces(this.state.performance.mean, 0)}ms with stdev {util.roundToPlaces(this.state.performance.stdev, 0)}ms</p>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </HalinCard>
        );
    }
}

MemberOverviewCard.props = {
    member: PropTypes.object.isRequired,
}

export default MemberOverviewCard;
