import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Confirm } from 'semantic-ui-react';
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
        return !this.props.database.isDefault && this.props.database.getLabel() !== neo4j.SYSTEM_DB;
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

                { !this.canAdminister() ?
                
                <div style={{paddingTop: '15px'}}>
                    <h4>Reserved Database</h4>
                    <p>Stopping, starting, and deleting databases is not
                        permitted for the default database, or the system
                        database.
                    </p>
                </div>
                
                : ''}

                <Confirm
                    open={this.state.dropConfirmOpen}
                    content='Are you sure?  This action will DESTROY ALL DATA IN THE DATABASE and cannot be undone'
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