import React, { Component } from 'react';
import { Button, Confirm } from 'semantic-ui-react';
import _ from 'lodash';
import neo4j from '../../../../api/driver/index';
import status from '../../../../api/status/index';

export default class KillTransaction extends Component {
    state = {
        open: false,
        message: null,
        error: null,
        pending: false,
    };

    getContent() {
        const tx = this.props.transaction;

        const style = {
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '16px',
            paddingBottom: '16px',
            overflowX: 'scroll',
        };

        if (tx.currentQuery) {
            const isLong = tx.currentQuery.length > 200;
            return (
                <div style={style}>
                    <pre>{tx.currentQuery.slice(0, 300) + (isLong ? '\n...(rest ommitted)' : '')}</pre>
                </div>
            );
        }

        return <p>Status: {tx.status}</p>;
    }

    kill(tx) {
        if (!_.get(tx, 'id')) {
            throw new Error('No valid transaction data');
        }

        this.setState({ pending: true });

        return this.props.member.run('CALL dbms.killTransaction({id})', { id: tx.id })
            .then(res => {
                const r = neo4j.unpackResults(res, {
                    required: ['transactionId', 'username', 'message'],
                });

                const m = r[0].message;
                const msg = {
                    header: `Killed transaction ${tx.id}`,
                    body: 
                        <span>
                            <p>{m}</p>
                            { m.indexOf('not found') > -1 ? 
                                <p>Your transaction may have completed before it could be killed.</p>
                            : ''}
                        </span>,
                };

                return this.setState({
                    pending: false, 
                    message: msg,
                    error: null,
                });
            })
            .catch(err => {
                console.error('Bad', err);

                return this.setState({
                    pending: false,
                    message: null,
                    error: status.message('Failed to kill transaction', `${err}`),
                });
            })
            .finally(() => status.toastify(this));
    }

    render() {
        const openConfirmKill = () => this.setState({ open: true });
        const closeConfirmKill = () => this.setState({ open: false });
        const confirm = () => {
            this.kill(this.props.transaction);
            closeConfirmKill();
        };

        return (
            <span className='KillTransaction'>
                <Button compact negative icon='delete' onClick={openConfirmKill} />
                <Confirm 
                    header={'Are you sure you want to kill ' + this.props.transaction.id + '?'}
                    content={this.getContent()}
                    open={this.state.open} 
                    onCancel={closeConfirmKill} 
                    onConfirm={confirm} />
            </span>
        );
    }
}