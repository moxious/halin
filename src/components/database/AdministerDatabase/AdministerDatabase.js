import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Confirm } from 'semantic-ui-react';
import status from '../../../api/status';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

class AdministerDatabase extends Component {
    state = {
        pending: false,
        dropConfirmOpen: false,
    };

    stopButton() {
        return <Button disabled={this.state.pending} size='large' primary negative onClick={() => this.stop()}>
            <Icon name='stop circle' />
            Stop
        </Button>;
    }

    dropButton() {
        const cancel = () => this.setState({ dropConfirmOpen: false });
        const confirm = () => {
            this.setState({ dropConfirmOpen: false });
            this.drop();
        };

        return (
            <div>
                <Button disabled={this.state.pending} size='large' negative onClick={() => this.setState({ dropConfirmOpen: true })}>
                    <Icon name='delete' />
                        Drop
                </Button>

                <Confirm
                    open={this.state.dropConfirmOpen}
                    content='Are you sure?  This action will DESTROY ALL DATA IN THE DATABASE and cannot be undone'
                    onCancel={cancel}
                    onConfirm={confirm}
                />
            </div>
        );
    }

    startButton() {
        return (
            <Button disabled={this.state.pending} size='large' primary positive onClick={() => this.stop()}>
                <Icon name='play circle' />
                Start
            </Button>
        );
    }

    doOperation(operationPromise, successMessage, failMessage) {
        this.setState({ pending: true });

        return operationPromise
            .then(() => {
                this.setState({
                    message: status.message('Success', successMessage),
                    error: null,
                });
            })
            .catch(err => {
                this.setState({
                    message: null,
                    error: status.message('Error', failMessage + `: ${err}`),
                });
            })
            .finally(() => {
                this.setState({ pending: false });
                status.toastify(this);
            });
    }

    manager() {
        return window.halinContext.getClusterManager();
    }

    stop() {
        return this.doOperation(this.manager().stopDatabase(this.props.database),
            `Stopped database ${this.props.database.name}`,
            `Failed to stop ${this.props.database.name}`);
    }

    start() {
        return this.doOperation(this.manager().startDatabase(this.props.database),
            `Started database ${this.props.database.name}`,
            `Failed to start ${this.props.database.name}`);
    }

    drop() {
        return this.doOperation(this.manager().dropDatabase(this.props.database),
            `Dropped database ${this.props.database.name}`,
            `Failed to drop database ${this.props.database.name}`);
    }

    render() {
        return (
            <HalinCard>
                <h3>Administer Database {this.props.database.name}</h3>

                <Button.Group>
                    {this.props.database.isOnline() ? this.stopButton() : this.startButton()}
                    {this.dropButton()}
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