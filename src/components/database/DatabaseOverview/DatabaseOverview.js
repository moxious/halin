import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { List } from 'semantic-ui-react';
import _ from 'lodash';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import MemberLabel from '../../ui/scaffold/MemberLabel/MemberLabel';

class DatabaseOverview extends Component {
    status(s) {
        if (s.currentStatus !== s.requestedStatus) {
            return `Transitioning from ${s.currentStatus} → ${s.requestedStatus}`;
        }

        return s.currentStatus;
    }

    errorInformation(s) {
        if (!s.error) { return ''; }
        return `Error Information: ${s.error}`;
    }

    membersByRole() {
        const byRole = this.props.database.getMembersByRole(window.halinContext);
        const roles = Object.keys(byRole);
        roles.sort();
        const roleList = (role, i) =>
            byRole[role].map((member, ki) => {
                return (
                    <List.Item key={ki}>
                        <MemberLabel member={member} detail={role}/>
                    </List.Item>
                );
            });

        return (
            <List>
                {
                    roles.map((role, i) => roleList(role, i))
                }
            </List>
        )
    }

    render() {
        const leader = this.props.database.getLeader(window.halinContext);

        return (
            <HalinCard id="DatabaseOverview" header='Overview' knowledgebase='Database'>
                {this.membersByRole()}

                <List>
                    {
                        _.sortBy(this.props.database.getMemberStatuses(), ['address']).map((s, i) =>
                            <List.Item key={i}>
                                {s.address}&nbsp;
                                <strong>{('' + s.role).toUpperCase()}</strong>&nbsp;
                                &nbsp;Status: {this.status(s)}
                                &nbsp;{this.errorInformation(s)}
                            </List.Item>)
                    }
                </List>

                <p>Last updated: {moment(this.props.database.created).format()}</p>
                { leader ? 
                    <p>Leader ID: {leader.id}</p> : 
                    <p><strong>No leader detected</strong>; 
                        &nbsp;database may be starting, stopping, or 
                    &nbsp;undergoing leader election</p> }
            </HalinCard>
        );
    };
}

DatabaseOverview.props = {
    node: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired,
};

export default DatabaseOverview;