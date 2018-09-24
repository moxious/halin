import React, { Component } from 'react';
import ShimConnectModal from './ShimConnectModal';

const buildFakeContext = (data) => {
    console.log('buildFakeContext',data);
    const { host, port, username, password, name, encrypted } = data;
    const fakeContext = {
        projects: [
            {
                name,
                graphs: [
                    {
                        name,
                        status: 'ACTIVE',
                        connection: {
                            configuration: {
                                protocols: {
                                    'bolt': {
                                        host,
                                        port,
                                        username,
                                        password,
                                        enabled: true,
                                        tlsLevel: encrypted ? 'REQUIRED' : 'OPTIONAL',
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        ],
    };

    return fakeContext;
};

export default class Neo4jDesktopStandIn extends Component {
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
        window.neo4jDesktopApi = {
            getContext: () =>
                Promise.resolve(buildFakeContext({
                    host,
                    port,
                    username,
                    password,
                    encrypted,
                    name: this.props.name || 'shim',
                })),
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
}