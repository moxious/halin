import React, { Component } from 'react';
import { Form, Message } from 'semantic-ui-react';
import status from '../../../../api/status/index';
import sentry from '../../../../api/sentry/index';
import './NewUserForm.css';

class NewUserForm extends Component {
    state = {
        username: '',
        password: '',
        requireChange: false,
        pending: false,
        message: null,
        error: null,
    };

    constructor(props, context) {
        super(props, context);
        this.onUserCreate = props.onUserCreate || (() => null);
    }

    createUser() {
        this.setState({ pending: true });

        const mgr = window.halinContext.getClusterManager();

        const user = {
            username: this.state.username,
            password: this.state.password,
        };

        return mgr.addUser(user)
            .then(clusterOpRes => {
                sentry.info('ClusterMgr result', clusterOpRes);
                const action = `Creating user ${user.username}`;

                if (clusterOpRes.success) {
                    this.setState({
                        pending: false,
                        message: status.fromClusterOp(action, clusterOpRes),
                        error: null,
                    });
                } else {
                    this.setState({
                        pending: false,
                        message: null,
                        error: status.fromClusterOp(action, clusterOpRes),
                    });
                }
            })
            .catch(err => this.setState({
                pending: false,
                message: null,
                error: status.message('Error',
                    `Could not create ${user.username}: ${err}`),
            }))
            .finally(() => status.toastify(this));
    }

    valid() {
        // Usernames must be strictly ASCII and have the weird quirk that they
        // can't contain , : or whitespace.
        if (this.state.username && (this.state.username.match(/[,:\s]/) || 
            // eslint-disable-next-line no-control-regex
            this.state.username.match(/[^\x00-\x7F]/))) {
            return false;
        }

        return true;
    }

    submit(event) {
        sentry.fine('submit',this.state);
        event.preventDefault();
        this.createUser();
    }
    
    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        this.setState(mod);
    }

    inputStyle = {
        minWidth: '150px',
        paddingTop: '10px',
        paddingBottom: '10px',
    };

    render() {
        return (
            <div className='NewUserForm'>
                <Form size="small" error={!this.valid()} style={{textAlign: 'left'}}>
                    <Form.Group widths='equal'>
                        <Form.Input 
                            fluid 
                            style={this.inputStyle}
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('username', e)} 
                            label='Username' 
                            placeholder='username'
                        />
                        <Form.Input 
                            fluid
                            style={this.inputStyle}
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('password', e)} 
                            label='Password' 
                            type='password'/>
                    </Form.Group>

                    <Message
                        error
                        header='Invalid username'
                        content='Usernames must be ASCII and cannot contain , : or whitespace'/>

                    <Form.Button positive
                            style={this.inputStyle}
                            disabled={this.state.pending || !this.valid() || !this.state.username || !this.state.password}
                            onClick={data => this.submit(data)} 
                            type='submit'>
                            <i className="icon add user"/> Create
                    </Form.Button>
                </Form>
            </div>
        )
    }
}

export default NewUserForm;