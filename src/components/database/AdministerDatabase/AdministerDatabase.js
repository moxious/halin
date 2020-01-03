import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Confirm, Message } from 'semantic-ui-react';
import status from '../../../api/status';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import neo4j from '../../../api/driver';

class AdministerDatabase extends Component {
    state = {
        pending: false,
        dropConfirmOpen: false,
    };

    canAdminister() {
        // For safety we won't allow stop/start/drop of the default DB
        // or the system DB where it would fail anyway.
        // We also can't start/stop/drop databases that are reconciling, that is, in the process
        // of starting or stopping.  You must wait for that operation to complete first.
        return (
            !this.props.database.isDefault() && 
            this.props.database.getLabel() !== neo4j.SYSTEM_DB &&
            !this.props.database.isReconciling()
        );
    }

    stopButton() {
        return <Button disabled={this.state.pending || !this.canAdminister()} size='large' primary negative onClick={() => this.stop()}>
            <Icon name='stop circle' />
            Stop
        </Button>;
    }

    dropButton() {
        return (
            <Button secondary disabled={this.state.pending || !this.canAdminister()} size='large' negative onClick={() => this.setState({ dropConfirmOpen: true })}>
                <Icon name='delete' />
                Drop
            </Button>
        );
    }

    startButton() {
        return (
            <Button disabled={this.state.pending || !this.canAdminister()} size='large' primary positive onClick={() => this.start()}>
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

    administrationWarnings() {
        if (this.canAdminister()) {
            return '';
        }

        let heading, message;

        if (this.props.database.isReconciling()) {
            heading = 'Database Reconciling';
            message = `The database is transitioning between states.
                You cannot administer the database while this operation is
                underway.`;
        } else {
            heading = 'Reserved Database';
            message = `Halin does not permit stopping, starting, or deleting 
            the default database, or system`;
        }

        return (
          <Message info>
                <Message.Header>{heading}</Message.Header>
                <p>{message}</p>
          </Message>
        );
    }

    render() {
        const cancel = () => this.setState({ dropConfirmOpen: false });
        const confirm = () => {
            this.setState({ dropConfirmOpen: false });
            this.drop();
        };

        return (
            <HalinCard>
                <h3>Administer Database {this.props.database.name}</h3>

                <div>
                    {this.props.database.isOnline() ? this.stopButton() : this.startButton()}
                    {this.dropButton()}
                </div>

                { this.administrationWarnings() }

                <Confirm
                    open={this.state.dropConfirmOpen}
                    header='Drop Database'
                    content={
                            <Message negative icon>
                                <Icon name='warning' />
                                <Message.Content>
                                    <Message.Header>CAUTION</Message.Header>
                                    
                                    <p>Are you sure?</p>
                                    <p>This action will <strong>DESTROY ALL DATA IN THE DATABASE</strong> and cannot be undone!</p>
                                </Message.Content>
                            </Message>
                    }
                    onCancel={cancel}
                    onConfirm={confirm}
                />
            </HalinCard>
        );
    }
}

AdministerDatabase.props = {
    member: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired,
};

export default AdministerDatabase;