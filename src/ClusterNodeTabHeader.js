import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react'

export default class ClusterNodeTabHeader extends Component {
    render() {
        const node = this.props.node;

        const leader = `${node.role}`.toLowerCase() === 'leader';
        const label = `${node.getLabel()} (${node.role})`;

        return (
            <Menu.Item>
                { leader ? <Icon name='star' color='yellow' /> : '' }
                <Icon name='database' /> 
                {label}
            </Menu.Item>
        );
    }
}