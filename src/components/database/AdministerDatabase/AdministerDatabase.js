import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'semantic-ui-react';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

class AdministerDatabase extends Component {
    state = {
        pending: false,
    };

    stopButton() {
        return <Button disabled={this.state.pending} size='large' primary negative onClick={() => this.stop()}>
            <Icon name='stop circle'/>
            Stop
        </Button>;
    }

    deleteButton() {
        return <Button disabled={this.state.pending} size='large' negative onClick={() => this.delete()}>
            <Icon name='delete'/>
            Delete
        </Button>
    }

    startButton() {
        return <Button disabled={this.state.pending} size='large' primary positive onClick={() => this.stop()}>
            <Icon name='play circle'/>
            Start
        </Button>
    }

    stop() {
        console.log('stop', this.props.database);
    }

    start() {
        console.log('start', this.props.database);
    }

    delete() {
        console.log('delete', this.props.database);
    }

    render() {
        return (
            <HalinCard>
                <h3>Administer Database { this.props.database.name }</h3>

                <Button.Group>
                    { this.props.database.isOnline() ? this.stopButton() : this.startButton() }
                    { this.deleteButton() }
                </Button.Group>
            </HalinCard>
        );
    }
}

AdministerDatabase.props = {
    member: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired,
};

export default AdministerDatabase;