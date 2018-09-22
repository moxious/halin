import React, { Component } from 'react';
import { Button, Form } from 'semantic-ui-react';
import "semantic-ui-css/semantic.min.css";
import * as PropTypes from "prop-types";
import 'semantic-ui-css/semantic.min.css';
import './NewUserForm.css';
import { Grid } from 'semantic-ui-react';
import status from '../../status/index';

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
        this.driver = props.driver || context.driver;
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
            .then(res => {
                console.log('ClusterMgr result', res);
                const action = `Creating user ${user.username}`;

                if (res.success) {
                    this.setState({
                        pending: false,
                        message: status.fromClusterOp(action, res),
                        error: null,
                    });
                } else {
                    const firstErr = res.results.filter(i => i.err)[0].err;
                    console.log('first err', firstErr, firstErr.message);

                    this.setState({
                        pending: false,
                        message: null,
                        error: status.fromClusterOp(action, res),
                    });
                }
            })
            .catch(err => this.setState({
                pending: false,
                message: null,
                error: status.message('Error',
                    `Could not create ${user.username}: ${err}`),
            }));
    }

    formValid() {
        return this.state.username && this.state.password;
    }

    submit(event) {
        console.log('submit',this.state);
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
        let message = status.formatStatusMessage(this);

        return (
            <div className='NewUserForm'>
                <h3>Create User</h3>

                { message }

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

NewUserForm.contextTypes = {
    driver: PropTypes.object,
};

export default NewUserForm;