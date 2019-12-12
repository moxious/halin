import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import { List, Grid, Label } from 'semantic-ui-react';
import util from '../../../api/data/util.js';
import DatabaseStatusIcon from '../../ui/scaffold/DatabaseStatusIcon/DatabaseStatusIcon';
import './MemberOverviewCard.css';

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

    databaseList() {
        const roles = this.props.member.getDatabaseRoles();
        const databases = Object.keys(roles);
        const set = window.halinContext.getDatabaseSet();
        databases.sort();

        const items = databases.map((dbName, k) => {
            const db = set.getDatabaseByName(dbName);
            const role = roles[dbName];

            return (
                <List.Item key={k}>
                    <Label>
                        <DatabaseStatusIcon db={db} />
                        {dbName}
                        <Label.Detail>{role}</Label.Detail>
                    </Label>
                </List.Item>
            );
        });

        return (
            <List style={{ textAlign: 'left' }}>
                {items}
            </List>
        );
    }

    render() {

        return (
            <HalinCard owner={this} 
                header='Overview' 
                knowledgebase='ClusterMember' 
                id='MemberOverviewCard'>
                {this.databaseList()}

                <Grid>
                    <Grid.Row>
                        <Grid.Column width={4}>
                            <SignalMeter strength={util.signalStrengthFromFreshRatio(this.state.fresh, this.state.total)} />
                        </Grid.Column>
                        <Grid.Column width={12}>
                            <p>{`${this.state.fresh} of ${this.state.total} fresh`};&nbsp;
                                {this.state.performance.observations.length} observations; mean response
                                &nbsp;{util.roundToPlaces(this.state.performance.mean, 0)}ms with stdev {util.roundToPlaces(this.state.performance.stdev, 0)}ms</p>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

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
            </HalinCard>
        );
    }
}

MemberOverviewCard.props = {
    member: PropTypes.object.isRequired,
}

export default MemberOverviewCard;
