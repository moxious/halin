import React, { Component } from 'react';
import { Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';

class DatabaseStatusIcon extends Component {
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

DatabaseStatusIcon.props = {
    db: PropTypes.object,
};

export default DatabaseStatusIcon;