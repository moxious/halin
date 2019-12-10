import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';

export default class DatabaseMenuItem extends Component {
    state = {
        currentState: null,
        status: 'online',
    };

    statusIcon = (db) => {
        let color = 'red';

        if (db.isReconciling()) {
            color = 'yellow';
        } else if (db.isOnline()) {
            color = 'green';
        }

        return <Icon name='database' color={color} />;
    }

    render() {
        return (
            <Menu.Item as='a'
                active={this.props.active}
                onClick={() => this.props.onSelect(this.props.database, this)}>
                {this.statusIcon(this.props.database)}
                {this.props.database.getLabel()}
            </Menu.Item>
        );
    }
}