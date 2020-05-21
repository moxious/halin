import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';

import ClusterMemberStatusIcon from '../ClusterMemberStatusIcon/ClusterMemberStatusIcon';

export default class ClusterMemberMenuItem extends Component {
    render() {
        return (
            <Menu.Item as='a'
                active={this.props.active} disabled={!this.props.member.isOnline()}
                onClick={() => this.props.onSelect(this.props.member, this)}>
                <ClusterMemberStatusIcon member={this.props.member}/>
                {this.props.member.getLabel()}
            </Menu.Item>
        );
    }
}