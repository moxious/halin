import React from 'react';
import PropTypes from 'prop-types';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import { List } from 'semantic-ui-react';

const MemberOverviewCard = (props) => {
    const roles = props.member.getDatabaseRoles();
    const databases = Object.keys(roles);

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
                    <List.Content>{props.member.id}</List.Content>
                </List.Item>

                {props.member.groups && props.member.groups.length > 0 ? <List.Item>
                    <List.Icon name='group' />
                    <List.Content>{props.member.groups}</List.Content>
                </List.Item> : ''}

                <List.Item>
                    <List.Icon name='address book' />
                    <List.Content>{props.member.addresses.join(', ')}</List.Content>
                </List.Item>
            </List>
        </HalinCard>
    );
}

MemberOverviewCard.props = {
    member: PropTypes.object.isRequired,
}

export default MemberOverviewCard;
