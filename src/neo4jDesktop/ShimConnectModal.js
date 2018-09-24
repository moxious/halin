import React, { Component } from "react";
import * as PropTypes from 'prop-types';
import { Render } from 'graph-app-kit/components/Render';
import { Button, Form, Modal, Message, Checkbox } from "semantic-ui-react";

class ConnectForm extends Component {
    state = {
        username: "neo4j",
        password: "",
        host: 'localhost',
        port: 7687,
        encrypted: false,
    };

    inputUpdated = (_, data) => {
        const { name, value } = data;

        if (name === 'encrypted') {
            // Checkbox passed through checked property, not value.
            return this.setState({
                [name]: data.checked,
            });
        }

        this.setState({ [name]: value });
    };

    onSubmit = () => this.props.onSubmit(this.state);

    render() {
        const { open, errorMsg, onClose } = this.props;
        const { username, password, host, port, encrypted } = this.state;
        return (
            <Modal size="tiny" open={open} onClose={onClose}>
                <Modal.Header>Connect to a graph</Modal.Header>
                <Modal.Content>
                    <Form error={errorMsg ? true : false}>
                        <Form.Field required>
                            <label>Host</label>
                            <Form.Input
                                value={host}
                                name="host"
                                onChange={this.inputUpdated}
                                placeholder="Host"
                            />
                        </Form.Field>

                        <Form.Field required>
                            <label>Port</label>
                            <Form.Input required
                                value={port}
                                name="port"
                                onChange={this.inputUpdated}
                                placeholder="Port"
                            />
                        </Form.Field>

                        <Form.Field required>
                            <label>Username</label>
                            <Form.Input required
                                value={username}
                                name="username"
                                onChange={this.inputUpdated}
                                placeholder="Username"
                            />
                        </Form.Field>

                        <Form.Field required>
                            <label>Password</label>
                            <Form.Input 
                                value={password}
                                name="password"
                                onChange={this.inputUpdated}
                                type="password"
                                placeholder="Password"
                            />
                        </Form.Field>

                        <Form.Field>
                            <Checkbox                                 
                                checked={encrypted}
                                name="encrypted"
                                onChange={this.inputUpdated}
                                type="checkbox"
                                label='Encrypt Connection'/>
                        </Form.Field>

                        <Render if={errorMsg}>
                            <Message error header="An error occurred" content={errorMsg} />
                        </Render>
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button
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
        const errorMsg = this.state.initial ? false : this.props.errorMsg;
        return (
            <ConnectForm
                onClose={this.closeModal}
                onSubmit={this.props.onSubmit}
                errorMsg={errorMsg}
                open={this.props.show && this.state.showModal}
            />
        );
    }
}

ShimConnectModal.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    errorMsg: PropTypes.string,
    show: PropTypes.bool
};

export default ShimConnectModal;