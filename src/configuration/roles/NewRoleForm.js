import React, { Component } from 'react';
import { Button, Form } from 'semantic-ui-react';
import "semantic-ui-css/semantic.min.css";
import * as PropTypes from "prop-types";
import 'semantic-ui-css/semantic.min.css';
import './NewRoleForm.css';
import { Grid } from 'semantic-ui-react';
import status from '../../status/index';
import hoc from '../../higherOrderComponents';
import sentry from '../../sentry/index';

class NewRoleForm extends Component {
    state = {
        role: null,
        pending: false,
        message: null,
        error: null,
    };

    constructor(props, context) {
        super(props, context);
        this.onRoleCreate = props.onRoleCreate || (() => null);
    }

    createRole() {
        this.setState({ pending: true });
        sentry.info('Creating role with driver ', this.driver);
        
        const mgr = window.halinContext.getClusterManager();

        return mgr.addRole(this.state.role)
            .then(clusterOpRes => {
                sentry.fine('ClusterMgr result', clusterOpRes);
                const action = `Creating role ${this.state.role}`;

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
                    `Could not create role ${this.state.role}: ${err}`),
            }));
    }

    formValid() {
        return this.state.role;
    }

    submit(event) {
        sentry.fine('submit', this.state);
        event.preventDefault();
        this.createRole();
    }
    
    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        // sentry.debug(mod);
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

export default hoc.enterpriseOnlyComponent(NewRoleForm, 'Create Roles');