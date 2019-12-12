import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';

export default class DatabaseStatusIcon extends Component {
    state = {
        currentState: null,
        status: 'online',
    };

    render() {
        let color = 'red';

        if (!this.props.db) {
            return <Icon name='hourglass start' color='yellow'/>;
        }

        if (this.props.db.isReconciling()) {
            color = 'yellow';
        } else if (this.props.db.isOnline()) {
            color = 'green';
        }

        return <Icon name='database' color={color} />;
    }
};