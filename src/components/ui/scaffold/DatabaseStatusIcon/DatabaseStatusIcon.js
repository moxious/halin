import React, { Component } from 'react';
import { Icon, Popup, List } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import _ from 'lodash';

class DatabaseStatusIcon extends Component {
    state = {
        currentState: null,
        status: 'online',
    };

    popupContent() {
        return (
            <div>
                {this.statusText()}
                {this.isDefault()}
                {this.errors()}
            </div>
        )
    }

    isDefault() {
        if (this.props.db.isDefault()) {
            return (<p><strong>This is the default database</strong></p>);
        }

        return '';
    }

    errors() {
        if (this.props.db.hasError()) {
            const errors = this.props.db.getErrors();
            const addrs = Object.keys(errors);

            return (<div>
                <strong>Reported errors:</strong>
                <List>
                    { addrs.map((addr, i) => 
                        <List.Item key={i}>
                            {addr}: {errors[addr]}
                        </List.Item>) }
                </List>
            </div>);
        }

        return <p>No reported errors</p>;
    }

    statusText() {       
        if (this.props.db.isOnline()) {
            return <p>Current Status: <strong>ONLINE</strong></p>            
        }

        return <p>Cluster is transitioning; reported statuses: <em>{this.props.db.getStatuses().join(', ')}</em></p>
    }

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

        return (
            <Popup content={this.popupContent()} trigger={
                <Icon name='database' color={color} {..._.pick(this.props, ['size'])}/>
            }/>
        );
    }
};

DatabaseStatusIcon.props = {
    db: PropTypes.object,
};

export default DatabaseStatusIcon;