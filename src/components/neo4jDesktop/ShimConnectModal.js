import React, { Component } from "react";
import { Button, Form, Modal, Message, Checkbox } from "semantic-ui-react";
import _ from 'lodash';
import sentry from '../../api/sentry/index';
import Splash from './Splash';

let privateLocalCreds = {};
// try {    
//     const env = 'localhost';
//     privateLocalCreds = require(`../../creds/${env}.json`);
// } catch (e) {
//     sentry.fine('No pre-configured halin credentials were found, but that\'s OK', e);
// }

class ConnectForm extends Component {
    state = {
        username: privateLocalCreds.username || process.env.NEO4J_USERNAME || 'neo4j',
        password: privateLocalCreds.password || process.env.NEO4J_PASSWORD || '',
        host: privateLocalCreds.host || process.env.NEO4J_URI || 'localhost',
        port: privateLocalCreds.port || 7687,
        encrypted: _.isNil(privateLocalCreds.encrypted) ? false : privateLocalCreds.encrypted,
        errors: {
            host: null,
            port: null,
            username: null,
            password: null,
            encrypted: null,
        }
    };

    formValid = () => (
        !this.formHasErrors() && 
        this.state.username && 
        this.state.password && 
        this.state.host && 
        this.state.port);

    formHasErrors = () => !_.isNil(
        this.state.errors.host || this.state.errors.port || this.state.errors.username ||
        this.state.errors.password || this.state.errors.encrypted);

    inputUpdated = (event, data) => {
        const { name, value } = data;

        const errors = _.cloneDeep(this.state.errors);
        if (name === 'host' && value && value.match(/[/:#?&@]/)) {
            errors.host = 'Host can only contain an IP address or hostname, no scheme (http) or port';
        } else {
            // Clear error if one used to be present.
            errors.host = null;
        }

        if (name === 'port' && value && value.match(/[^0-9]/)) {
            errors.port = 'Port must be a number, for example 7687 for Bolt'
        } else {
            errors.port = null;
        }

        if (name === 'password' && !value) {
            errors.password = 'You must specify a password';
        } else {
            errors.password = null;
        }

        if (name === 'username' && !value) {
            errors.username = 'You must specify a username';
        } else {
            errors.username = null;
        }

        if (name === 'encrypted') {
            // Checkbox passed through checked property, not value.
            return this.setState({
                [name]: data.checked,
                errors,
            });
        }

        this.setState({ [name]: value, errors });
        event.preventDefault();
    };

    onSubmit = () => this.props.onSubmit(this.state);

    componentWillMount() {
        sentry.fine('ShimConnectModal: running outside of Neo4j Desktop');
    }

    render() {
        const { open, onClose } = this.props;
        return (
            <Modal size="tiny" closeOnEscape={false} closeOnDimmerClick={false} open={open} onClose={onClose}>
                <Modal.Header>Connect to a graph</Modal.Header>
                <Modal.Content>
                    <Splash/>

                    <Form>
                        <Form.Field required>
                            <label>Host</label>
                            <Form.Input
                                value={this.state.host}
                                name="host"
                                onChange={this.inputUpdated}
                                placeholder="Host"
                            />

                            <Message 
                                visible={!_.isNil(this.state.errors.host)} 
                                warning>{this.state.errors.host}</Message>
                        </Form.Field>

                        <Form.Field required>
                            <label>Port</label>
                            <Form.Input required
                                value={this.state.port}
                                name="port"
                                onChange={this.inputUpdated}
                                placeholder="Port"
                            />
                            <Message 
                                visible={!_.isNil(this.state.errors.port)} 
                                warning>{this.state.errors.port}</Message>
                        </Form.Field>

                        <Form.Field required>
                            <label>Username</label>
                            <Form.Input required
                                value={this.state.username}
                                name="username"
                                onChange={this.inputUpdated}
                                placeholder="Username"
                            />
                            <Message 
                                visible={!_.isNil(this.state.errors.username)} 
                                warning>{this.state.errors.username}</Message>
                        </Form.Field>

                        <Form.Field required>
                            <label>Password</label>
                            <Form.Input 
                                value={this.state.password}
                                name="password"
                                onChange={this.inputUpdated}
                                type="password"
                                placeholder="Password"
                            />
                            <Message 
                                visible={!_.isNil(this.state.errors.password)} 
                                warning>{this.state.errors.password}</Message>
                        </Form.Field>

                        <Form.Field>
                            <Checkbox                                 
                                checked={this.state.encrypted}
                                name="encrypted"
                                onChange={this.inputUpdated}
                                type="checkbox"
                                label='Encrypt Connection'/>
                        </Form.Field>
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        disabled={!this.formValid()}
                        onClick={this.onSubmit}
                        positive
                        icon="right arrow"
                        labelPosition="right"
                        content="Connect"
                    />
                </Modal.Actions>
            </Modal>
        );
    }
}

class ShimConnectModal extends Component {
    state = {
        showModal: true,
        initial: true
    };
    closeModal = () => {
        this.setState({ showModal: false });
    };
    render() {
        return (
            <ConnectForm
                onClose={this.closeModal}
                onSubmit={this.props.onSubmit}
                open={this.props.show && this.state.showModal}
            />
        );
    }
}

export default ShimConnectModal;