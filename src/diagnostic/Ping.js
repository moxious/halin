import React, { Component } from 'react';
import status from '../status/index';
import Spinner from '../Spinner';
import NodeLabel from '../NodeLabel';
import { Button, Icon, Table } from 'semantic-ui-react';
import SignalMeter from '../data/SignalMeter';
import datautil from '../data/util';

export default class Ping extends Component {
    state = {
        allResults: [],
        pingResults: null,
        message: null,
        error: null,
    };

    componentWillMount() {
        this.ping();
    }

    ping() {
        const ctx = window.halinContext;

        const promises = ctx.clusterNodes.map(node => ctx.ping(node));

        if (this.state.pingResults) {
            this.state.allResults.push(this.state.pingResults);
        }

        this.setState({ 
            pingResults: null,
            message: null,
            error: null,
        });

        return Promise.all(promises)
            .then(pingResults => {
                this.setState({
                    pingResults,
                    message: null,
                    error: null,
                });
            })
            .catch(err => {
                this.setState({
                    error: status.message('Failed to ping Neo4j', `${err}`),
                });
            });
    }

    haveErrors() {
        if (!this.state.pingResults) { return false; }
        return this.state.pingResults.filter(pr => pr.err).length > 0;
    }

    render() {
        let message = status.formatStatusMessage(this);

        return this.state.pingResults ? (
            <div className='Ping'>
                <h2>Ping</h2>

                Ping sends a trivial cypher query to the server and measures how long it takes the response
                to come back.

                { message }
                <Table celled>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Machine</Table.HeaderCell>
                            <Table.HeaderCell>Role</Table.HeaderCell>
                            <Table.HeaderCell>Result (ms)</Table.HeaderCell>
                            <Table.HeaderCell>Status</Table.HeaderCell>
                            { this.haveErrors() ? <Table.HeaderCell>Other Information</Table.HeaderCell> : '' }
                        </Table.Row>
                    </Table.Header>
                    <tbody>
                    {
                        this.state.pingResults.map((r, idx) => 
                            <Table.Row key={idx}>
                                <Table.Cell>
                                    <NodeLabel node={r.clusterNode}/>
                                </Table.Cell>
                                <Table.Cell>{r.clusterNode.role}</Table.Cell>
                                <Table.Cell>{r.elapsedMs}</Table.Cell>
                                <Table.Cell>
                                    <SignalMeter 
                                        strength={datautil.signalStrengthFromPing(r.elapsedMs, r.err)}
                                    />
                                </Table.Cell>
                                { this.haveErrors() ? <Table.Cell>{r.err ? `${r.err}` : 'none'}</Table.Cell> : '' }
                            </Table.Row>)
                    }
                    </tbody>
                </Table>

                <Button basic onClick={() => this.ping()}>
                    <Icon name='cogs'/>
                    Ping Again
                </Button>
            </div>
        ) : <Spinner active={true}/>;
    }
}