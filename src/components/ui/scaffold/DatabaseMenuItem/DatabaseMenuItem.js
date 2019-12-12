import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import DatabaseStatusIcon from '../DatabaseStatusIcon/DatabaseStatusIcon';

export default class DatabaseMenuItem extends Component {
    state = {
        currentState: null,
        status: 'online',
    };

    render() {
        return (
            <Menu.Item as='a'
                active={this.props.active}
                onClick={() => this.props.onSelect(this.props.database, this)}>
                <DatabaseStatusIcon db={this.props.database}/>
                {this.props.database.getLabel()}
            </Menu.Item>
        );
    }
}