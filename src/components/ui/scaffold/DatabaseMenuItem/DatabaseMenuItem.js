import React, { Component } from 'react';
import { Menu, Icon, Popup } from 'semantic-ui-react';

export default class DatabaseMenuItem extends Component {
    state = {
        currentState: null,
        status: 'online',
    };

    statusIcon = (db) => {
        let color = 'red';

        if (db.status === 'online') {
            color = 'green';
        }

        return <Icon name='database' color={color} />;
    }

    popupContent = () => {
        return (
            <div className='PopupContent'>
                Popup content here.
            </div>
        );
    };

    render() {
        return (
            <Popup
                inverted
                position='right center'
                wide='very'
                key={this.props.database.getLabel()}
                trigger={
                    <Menu.Item as='a'
                        active={this.props.active}
                        onClick={() => this.props.onSelect(this.props.database, this)}>
                        {this.statusIcon(this.props.database)}
                        {this.props.database.getLabel()}
                    </Menu.Item>
                }
                header={`Status: ${this.props.database.getStatus()}`}
                content={this.popupContent()}
            />

        );
    }
}