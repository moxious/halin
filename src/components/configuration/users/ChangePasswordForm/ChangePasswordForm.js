import React, { Component } from 'react';
import { Form, Message } from 'semantic-ui-react';
import _ from 'lodash';
import status from '../../../../api/status/index';
import sentry from '../../../../api/sentry/index';

export default class ChangePasswordForm extends Component {
    state = {
        password1: null,
        password2: null,
        pending: false,
    }

    passwordsMatch() {
        return (this.state.password1 === this.state.password2);
    }
    
    filledOut() {
        return this.state.password1 && this.state.password2;
    }

    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        this.setState(mod);
    }

    submit(event) {
        sentry.fine('submit',this.state);
        event.preventDefault();
        this.changePassword();
    }

    changePassword() {
        if (!this.filledOut() || !this.passwordsMatch()) {
            throw new Error('This should never occur; cannot change password with invalid form');
        }

        this.setState({ pending: true });

        const mgr = window.halinContext.getClusterManager();

        const user = {
            username: this.props.username,
            password: this.state.password1,
        };

        return mgr.changeUserPassword(user)
            .then(clusterOpRes => {
                sentry.info('ClusterMgr result', clusterOpRes);
                const action = `Change password for ${user.username}`;

                if (clusterOpRes.success) {
                    this.setState({
                        pending: false,
                        error: null,
                        message: status.fromClusterOp(action, clusterOpRes),
                    });
                } else {
                    this.setState({
                        pending: false,
                        error: status.fromClusterOp(action, clusterOpRes),
                    });
                }
            })
            .catch(err => this.setState({
                pending: false,
                message: null,
                error: status.message('Error', `Could not change user password: ${err}`),
            }))
            .finally(() => status.toastify(this));
    }

    render() {
        return (
            <div className='ChangePasswordForm'>
                <Form size="small" error={this.filledOut() && !this.passwordsMatch()} style={{textAlign: 'left'}}>
                    <Form.Group widths='equal'>
                        {/* <Form.Field>
                            <Form.Input 
                                label='Username' 
                                value={this.props.username} 
                                disabled />
                        </Form.Field>                         */}
                        <Form.Input 
                            style={this.inputStyle}
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('password1', e)} 
                            label='New Password' 
                            type='password'/>
                        <Form.Input 
                            style={this.inputStyle}
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('password2', e)} 
                            label='Repeat New Password' 
                            type='password'/>
                    </Form.Group>

                    <Message
                        error
                        header='Passwords must match'
                        content='Please try again'/>

                    <Form.Button positive
                            style={this.inputStyle}
                            disabled={
                                this.state.pending || 
                                !this.passwordsMatch() ||
                                !this.filledOut()
                            }
                            onClick={data => this.submit(data)} 
                            type='submit'>
                            <i className="icon key"/> Change Password
                    </Form.Button>
                </Form>
            </div>
        );
    }
};
