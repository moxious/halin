import React, { Component } from 'react';
import ShimConnectModal from './ShimConnectModal';
import HalinContext from '../../api/HalinContext';

export default class ConnectionDetailsProvider extends Component {
    state = {
        username: null,
        password: null,
        host: null,
        port: null,
        encrypted: null,
    };

    stateComplete() {
        return this.state.username && this.state.password && this.state.host && this.state.port;
    }

    onSubmit = ({ username, password, host, port, encrypted }) => {
        HalinContext.connectionDetails = {
            host: host.trim(),
            port,
            username,
            password,
            encrypted,
            name: this.props.name || 'shim',
        };

        this.setState({ username, password, host, port, encrypted });
    }

    render() {
        if (this.stateComplete()) {
            return this.props.children;
        }

        return (
            <ShimConnectModal
                key='modal'
                errorMsg=''
                onSubmit={this.onSubmit}
                show={true}
            />
        )
    }
};
