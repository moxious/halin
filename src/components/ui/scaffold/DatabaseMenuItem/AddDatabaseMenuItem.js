import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';

import CreateDatabase from '../../../database/CreateDatabase/CreateDatabase';

export default class AddDatabaseMenuItem extends Component {
    state = {
        currentState: null,
        status: 'online',
        open: false,
    };

    addDatabase() {
        console.log('You want to add a database');
        this.setState({ open: true });
    }

    render() {
        return (
            <Menu.Item as='a'
                active={this.props.active}
                onClick={() => this.addDatabase()}>
                <Icon name='add' color='green' />
                Create New Database
                <CreateDatabase 
                    onCreate={() => this.setState({ open: false })}
                    onCancel={() => this.setState({ open: false })}
                    open={this.state.open} 
                    member={window.halinContext.getWriteMember()} 
                />
            </Menu.Item>
        );
    }
}