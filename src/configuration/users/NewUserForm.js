import React, { Component } from 'react';
import { Button, Form } from 'semantic-ui-react';
import "semantic-ui-css/semantic.min.css";
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react';
import status from '../../status/index';
import sentry from '../../sentry/index';
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

    formValid() {
        return this.state.username && this.state.password;
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
                <h3>Create User</h3>

                <Form>
                    <Form.Group widths='equal'>
                    <Grid>
                        <Grid.Row columns={2}>
                            <Grid.Column>
                                <Form.Input 
                                    fluid 
                                    style={this.inputStyle}
                                    disabled={this.state.pending}
                                    onChange={e => this.handleChange('username', e)} 
                                    label='Username' 
                                    placeholder='username'
                                />
                            </Grid.Column>
                            <Grid.Column>
                                <Form.Input 
                                    fluid
                                    style={this.inputStyle}
                                    disabled={this.state.pending}
                                    onChange={e => this.handleChange('password', e)} 
                                    label='Password' 
                                    type='password'/>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column textAlign='left'>
                                <Button positive
                                    style={this.inputStyle}
                                    disabled={this.state.pending || !this.formValid()} 
                                    onClick={data => this.submit(data)} 
                                    type='submit'>
                                    <i className="icon add user"/> Create
                                </Button>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    </Form.Group>
                </Form>
            </div>
        )
    }
}

export default NewUserForm;