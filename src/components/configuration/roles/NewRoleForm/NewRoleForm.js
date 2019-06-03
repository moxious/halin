import React, { Component } from 'react';
import { Form, Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import './NewRoleForm.css';
import status from '../../../../api/status/index';
import hoc from '../../../higherOrderComponents';
import sentry from '../../../../api/sentry/index';

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
            }))
            .finally(() => status.toastify(this));
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

    valid() {
        if (!this.state.role) { return true; }
        return this.state.role.match(/^[A-Za-z0-9]+$/);
    }

    render() {
        return (
            <div className='NewRoleForm'>
                <Form error={!this.valid()} size="small" style={{ textAlign: 'left' }}>
                    <Form.Group widths='equal'>
                        <Form.Input
                            fluid                            
                            style={this.inputStyle}
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('role', e)}
                            label='Role Name'
                            placeholder='myCustomRole'
                        />
                    </Form.Group>
                    <Message
                        error
                        header='Invalid role name'
                        content='Role names may consist only of simple letters and numbers'/>

                    <Form.Button positive
                        style={this.inputStyle}
                        disabled={this.state.pending || !this.valid() || !this.state.role}
                        onClick={data => this.submit(data)}
                        type='submit'>
                        <i className="icon add" /> Create
                    </Form.Button>
                </Form>
            </div>
        )
    }
}

export default hoc.enterpriseOnlyComponent(NewRoleForm, 'Create Roles');