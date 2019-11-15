import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Form, Message } from 'semantic-ui-react';
import _ from 'lodash';
import sentry from '../../../api/sentry';
import status from '../../../api/status/index';

const defaultState = {
    open: false,
    name: '',
    pending: false,
    message: null,
    error: null,
};

class CreateDatabase extends Component {
    state = _.cloneDeep(defaultState);

    resetState() {
        this.setState(_.cloneDeep(defaultState));
    }

    formValid = () => {
        return this.state.name && 
            // Don't allow duplicate names
            window.halinContext.getClusterManager().databases().filter(db => db.name === this.state.name).length === 0;
    }

    ok = () => {
        console.log('TODO -- logic to create database named ', this.state.name);
        this.setState({ pending: true });
        return window.halinContext.getClusterManager().createDatabase(this.state.name)
            .then(() => {
                this.setState({ 
                    open: false, 
                    message: status.message('Success', `Created database ${this.state.name}`),
                    error: null,
                });

                if (this.props.onCreate) {
                    return this.props.onCreate(this.state.name);
                }
            })
            .catch(err => {
                sentry.error('Failed to create database', err);
                this.setState({ 
                    message: null, 
                    error: status.message('Error',
                        `Failed to create database ${this.state.name}: ${err}`),
                });

                if (this.props.onCancel) {
                    return this.props.onCancel();
                }
            })
            .finally(() => {
                this.setState({ pending: false });
                status.toastify(this);
            })
            .then(() => this.resetState());
    }
    
    cancel = () => {
        this.resetState();
        if (this.props.onCancel) {
            return this.props.onCancel();
        }
    };

    UNSAFE_componentWillReceiveProps(props) {
        this.setState({ open: props.open });
    }

    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        this.setState(mod);
    }

    formHasErrors = () => {
        if (_.isEmpty(this.state.name)) {
            // user hasn't put anything in that's not an error.
            return false;
        }

        return !this.formValid();
    };

    render() {
        return (
            <Modal className='CreateDatabaseModal' open={this.state.open}>
                <Modal.Header>Create Database</Modal.Header>
                <Modal.Content>
                    <Form error={this.formHasErrors()} size='small' style={{ textAlign: 'left' }}>
                        <Form.Input 
                            fluid 
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('name', e)}
                            label='Database Name' />

                        <Message
                            error
                            header={ this.state.error ? 'Error' : 'Invalid database name' }
                            content={
                                <div>
                                    Database names may consist only of simple letters and numbers,
                                    and may not match any other existing database name.
                                </div>
                            }/>
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button basic color='red' onClick={this.cancel}>
                        Cancel
                    </Button>
                    <Button basic color='green' disabled={!this.formValid()} onClick={this.ok}>
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

CreateDatabase.props = {
    member: PropTypes.object,
};

export default CreateDatabase;