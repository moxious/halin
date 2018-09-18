import React, { Component } from 'react';
import { Button, Form } from 'semantic-ui-react';
import "semantic-ui-css/semantic.min.css";
import * as PropTypes from "prop-types";
import 'semantic-ui-css/semantic.min.css';
import './NewRoleForm.css';
import { Grid } from 'semantic-ui-react';
import status from '../../status/index';

class NewRoleForm extends Component {
    state = {
        role: null,
        pending: false,
        message: null,
        error: null,
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
        this.onRoleCreate = props.onRoleCreate || (() => null);
    }

    createRole() {
        this.setState({ pending: true });
        console.log('Creating role with driver ',this.driver);
        const session = this.driver.session();

        const role = this.state.role;

        return session.run(`
            call dbms.security.createRole({role})
        `, this.state)
            .then(results => {
                // On success this call sends nothing back.
                const msg = {
                    header: 'Success',
                    body: `Created role ${role}`,
                };
                this.setState({ 
                    pending: false, 
                    message: msg,
                    error: null,
                });
                return this.onRoleCreate(role);
            })
            .catch(err => {
                const msg = {
                    header: 'Error',
                    body: `Failed to create role ${role}: ${err}`,
                };
                this.setState({ error: msg, message: null, pending: false });
            })
            .finally(() => session.close());
    }

    formValid() {
        return this.state.role;
    }

    submit(event) {
        console.log('submit', this.state);
        event.preventDefault();
        this.createRole();
    }
    
    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        // console.log(mod);
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
            <div className='NewRoleForm'>
                <h3>Create Role</h3>

                { message }

                <Form>
                    <Form.Group widths='equal'>
                    <Grid>
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Form.Input 
                                    fluid 
                                    style={this.inputStyle}
                                    disabled={this.state.pending}
                                    onChange={e => this.handleChange('role', e)} 
                                    label='Role Name' 
                                    placeholder='myCustomRole'
                                />
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column textAlign='left'>
                                <Button positive
                                        style={this.inputStyle}
                                        disabled={this.state.pending || !this.formValid()} 
                                        onClick={data => this.submit(data)} 
                                        type='submit'>
                                    <i className="icon add"/> Create
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

NewRoleForm.contextTypes = {
    driver: PropTypes.object,
};

export default NewRoleForm;