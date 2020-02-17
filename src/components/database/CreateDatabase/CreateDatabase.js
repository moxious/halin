import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Message } from 'semantic-ui-react';
import _ from 'lodash';
import sentry from '../../../api/sentry';
import status from '../../../api/status/index';
import Spinner from '../../ui/scaffold/Spinner/Spinner';

const defaultState = {
    name: '',
    pending: false,
    error: null,
};

class CreateDatabase extends Component {
    state = _.cloneDeep(defaultState);

    resetState() {
        this.setState(_.cloneDeep(defaultState));
    }

    formValid = () => {
        // Must start with an ASCII character, then contain only ascii, numbers, dots, dashes.
        const nameValid = this.state.name && this.state.name.match(/^[A-Za-z][A-Za-z0-9.-]*$/);

        return nameValid &&
            // Don't allow duplicate names
            window.halinContext.databases().filter(db => db.name === this.state.name).length === 0;
    }

    handleSubmit = () => {
        console.log('Creating database', this.state.name);
        this.setState({ pending: true });
        
        let error = null;

        return window.halinContext.getClusterManager().createDatabase(this.state.name)
            .catch(err => {
                sentry.error('Failed to create database', err);
                error = status.message('Error',
                    `Failed to create database ${this.state.name}: ${err}`);
            })
            .finally(() => {
                this.setState({ pending: false, error, name: '' });

                if (error) {
                    status.toastify(this);
                }
            });
    }

    formHasErrors = () => {
        if (_.isEmpty(this.state.name)) {
            // user hasn't put anything in that's not an error.
            return false;
        }

        return !this.formValid();
    };

    handleChange = (e, { name, value }) => {
        this.setState({ [name]: value });
    };

    render() {
        return (
            <div className='CreateDatabaseModal'>
                <Form
                    error={this.formHasErrors()}
                    style={{ textAlign: 'left' }}>

                    <Form.Group>
                        <Form.Input
                            name='name'
                            value={this.state.name}
                            onChange={this.handleChange}
                            label='Database Name' />
                    </Form.Group>

                    <Form.Button 
                        disabled={!this.state.name || this.formHasErrors()}
                        onClick={this.handleSubmit}
                        type='submit' 
                        content='Create' />

                    <Message
                        error
                        header={this.state.error ? 'Error' : 'Invalid database name'}
                        content={
                            <div>
                                Database names may consist only of simple letters and numbers,
                                dots, and dashes, and must start with an ASCII letter.
                                They may not match any other existing database name.
                            </div>
                        } />
                </Form>

                <Message>
                    <Message.Header>Notice</Message.Header>

                    <p>This feature schedules creation of a database.  After you create,
                        it may take a bit of time for the database to appear in Halin.
                    </p>
                </Message>

                {this.state.pending ? <Spinner /> : ''}
            </div>
        );
    }
}

CreateDatabase.props = {
    member: PropTypes.object.isRequired,
};

export default CreateDatabase;