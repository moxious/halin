import React, { Component } from 'react';
import status from '../api/status/index';
import Spinner from '../components/ui/Spinner';
import NodeLabel from '../NodeLabel';
import { Button, Icon, Table } from 'semantic-ui-react';
import SignalMeter from '../components/data/SignalMeter';
import datautil from '../api/data/util';
import sentry from '../sentry/index';
import Explainer from '../components/Explainer';

export default class Ping extends Component {
    state = {
        allResults: [],
        pingResults: null,
        message: null,
        error: null,
    };

    componentWillMount() {
        this.mounted = true;
        this.ping();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    ping() {
        if (!this.mounted) { return false; }
        const ctx = window.halinContext;

        const promises = ctx.members().map(node => ctx.ping(node));

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
                if (this.mounted) {
                    this.setState({
                        pingResults,
                        message: null,
                        error: null,
                    });
                }
            })
            .catch(err => {
                sentry.reportError(err);
                if (this.mounted) {
                    this.setState({
                        error: status.message('Failed to ping Neo4j', `${err}`),
                    });
                }
            });
    }

    haveErrors() {
        if (!this.state.pingResults) { return false; }
        return this.state.pingResults.filter(pr => pr.err).length > 0;
    }

    render() {
        let message = status.formatStatusMessage(this);

        let rows = [
            { header: 'Machine', show: true, render: r => <NodeLabel node={r.clusterMember} /> },
            { header: 'Role', show: true, render: r => r.clusterMember.role },
            { header: 'Result (ms)', show: true, render: r => r.elapsedMs },
            { header: 'Status', show: true, render: r => <SignalMeter strength={datautil.signalStrengthFromPing(r.elapsedMs, r.err) } /> },
            { 
                header: 'Other Information',
                show: this.haveErrors(),
                render: r => r.err ? `${r.err}` : 'none',
            },
        ];

        return this.state.pingResults ? (
            <div className='Ping'>
                <h3>Ping <Explainer knowledgebase='Ping'/></h3>

                { message }
                <Table celled>
                    <Table.Header>
                        <Table.Row>{ 
                            rows.map((r, i) => <Table.HeaderCell key={i}>{r.header}</Table.HeaderCell>) 
                        }</Table.Row>
                    </Table.Header>
                    <Table.Body>
                    {
                        this.state.pingResults.map((r, resultIdx) => 
                            <Table.Row key={resultIdx}>{
                                rows.map((row, rowIdx) => 
                                    <Table.Cell key={rowIdx}>{row.render(r)}</Table.Cell>)
                            }</Table.Row>)
                    }
                    </Table.Body>
                </Table>

                <Button basic onClick={() => this.ping()}>
                    <Icon name='cogs'/>
                    Ping Again
                </Button>
            </div>
        ) : <Spinner active={true}/>;
    }
}