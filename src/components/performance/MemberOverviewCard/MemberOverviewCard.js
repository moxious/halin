import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import { List, Grid, Label, Icon } from 'semantic-ui-react';
import util from '../../../api/data/util.js';
import ClusterMember from '../../../api/cluster/ClusterMember';
import DatabaseStatusIcon from '../../ui/scaffold/DatabaseStatusIcon/DatabaseStatusIcon';
import './MemberOverviewCard.css';
import _ from 'lodash';
import api from '../../../api';

import SignalMeter from '../../data/SignalMeter/SignalMeter';

class MemberOverviewCard extends Component {
    state = {
        currentState: null,
        score: 1,
        total: 1,
        fresh: 1,
        notFresh: 0,
        performance: { observations: [] },
        storeSizes: {},
        totalSize: null,
    };

    sampleFeeds() {
        if (!this.mounted) { return null; }
        const score = this.props.member.getHealthScore(window.halinContext);
        this.setState(score);
    }

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.sampleFeeds(), 500);
        
        if (window.halinContext.getVersion().major >= 4) {
            return window.halinContext.getClusterManager().getDatabaseStoreSizes()
                .then(storeSizes => {                    
                    const totalSize = Object.values(storeSizes).reduce((a, b) => a+b, 0);
                    this.setState({ storeSizes, totalSize });
                })
                .catch(err => {
                    this.setState({ error: err, storeSizes: {} });
                    api.sentry.error('Error getting store sizes', err);
                });
        }
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    static iconFor(role) {
        const icons = {
            [ClusterMember.ROLE_LEADER]: 'star',
            [ClusterMember.ROLE_FOLLOWER]: 'circle',
            [ClusterMember.ROLE_REPLICA]: 'copy',
        };

        const name = icons[role] || 'circle';

        return <Icon name={name} />;
    }

    databaseList() {
        const roles = this.props.member.getDatabaseRoles();        
        const set = window.halinContext.getDatabaseSet();
        const allNames = set.databases().map(d => d.getLabel());
        allNames.sort();

        const items = allNames.map((dbName, k) => {
            const db = set.getDatabaseByName(dbName);

            // #operability dbms.cluster.overview is how we know which member
            // has which DB role.  But in the SINGLE setup, you can't call
            // that proc, meaning you can't get its leader/follower status for
            // various DBs.  So roles[dbName] = null happens when you're asking
            // about some other database in a non-clustered setup.  If the value
            // is missing, it means it wasn't knowable at startup time, and we're
            // a SINGLE database.
            const role = roles[dbName] || 'SINGLE';

            return (
                <List.Item key={k}>
                    <Label>
                        <DatabaseStatusIcon db={db} />
                        {dbName}
                        {
                            !_.isNil(this.state.storeSizes[dbName]) ? 
                            <Label.Detail>{util.humanDataSize(this.state.storeSizes[dbName])}</Label.Detail>
                            : ''
                        }
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
        const left = { textAlign: 'left' };
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
                            <List style={left}>
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

                                {
                                    this.state.totalSize && !_.isNil(this.state.storeSizes) ? 
                                    <List.Item>
                                        <List.Icon name='disk'/>
                                        <List.Content>{util.humanDataSize(this.state.totalSize)} store data on disk</List.Content>
                                    </List.Item> : ''
                                }
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

                <p style={left}>
                    {this.state.performance.observations.length} observations;&nbsp;
                    mean {util.roundToPlaces(this.state.performance.mean, 0)}ms stdev {util.roundToPlaces(this.state.performance.stdev, 0)}ms</p>
            </HalinCard>
        );
    }
}

MemberOverviewCard.props = {
    member: PropTypes.object.isRequired,
}

export default MemberOverviewCard;
