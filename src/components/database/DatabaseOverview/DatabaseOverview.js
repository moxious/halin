import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { List, Icon, Label } from 'semantic-ui-react';
import _ from 'lodash';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import MemberLabel from '../../ui/scaffold/MemberLabel/MemberLabel';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

const FabricDesignator = props =>
    <List.Item>
    <Label>
        <Icon name='cubes'/>
        Fabric Database 
        <Label.Detail><Explainer knowledgebase='Fabric'/></Label.Detail>
    </Label>
    </List.Item>;

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

    unavailable() {
        return (
            <HalinCard id="DatabaseOverview" header='Overview' knowledgebase='Database'>
                <strong>Database details are unavailable</strong>
            </HalinCard>
        );
    }

    render() {
        if (!this.props.database) {
            return this.unavailable();
        }

        // While database status is updating, it's possible (race condition) for us to have multiple leaders.
        // The false argument says that if we find multiple leaders, it's not fatal.  In the UI this will get
        // picked up quite quickly.  If it persists, it's a big problem with the cluster and that should never
        // occur.
        const leader = this.props.database.getLeader(window.halinContext, false);
        const fabric = leader ? leader.usesFabric() : false;
        const fabricHere = _.get(fabric, 'database') === this.props.database.getLabel();

        return (
            <HalinCard id="DatabaseOverview" header='Overview' knowledgebase='Database'>
                {this.membersByRole()}

                <List>
                    { fabricHere ? <FabricDesignator/> : '' }
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