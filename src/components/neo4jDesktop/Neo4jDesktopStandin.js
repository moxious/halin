import React, { Component } from 'react';
import uuid from 'uuid';

import ShimConnectModal from './ShimConnectModal';

const buildFakeContext = (data) => {
    const { host, port, username, password, name, encrypted } = data;
    const fakeContext = {
        implementation: 'Halin.Neo4jDesktopStandIn',
        global: {
            online: true,
            settings: {
                allowSendReports: true,
                allowSendStats: true,
                allowStoreCredentials: true
            }
        },
        projects: [
            {
                name,
                graphs: [
                    {
                        name,
                        status: 'ACTIVE',
                        databaseStatus: 'RUNNING',
                        databaseType: 'neo4j',
                        id: uuid.v4(),
                        connection: {
                            configuration: {
                                path: '.',
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

class Neo4jDesktopStandIn extends Component {
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

Neo4jDesktopStandIn.buildFakeContext = buildFakeContext;

export default Neo4jDesktopStandIn;