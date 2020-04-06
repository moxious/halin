import React, { Component } from 'react';
import { Form, Message } from 'semantic-ui-react';
import status from '../../../../api/status/index';
import hoc from '../../../higherOrderComponents';
import sentry from '../../../../api/sentry/index';
import PropTypes from 'prop-types';

class CopyRoleForm extends Component {
    state = {
        role: null,
        pending: false,
        error: null,
    };

    constructor(props, context) {
        super(props, context);
        this.onRoleCreate = props.onRoleCreate || (() => null);
    }

    createRole() {
        this.setState({ pending: true });
        sentry.info('Creating role copy with driver ', this.driver);

        const mgr = window.halinContext.getClusterManager();

        return mgr.copyRole(this.props.role, this.state.role)
            .then(clusterOpRes => {
                sentry.fine('ClusterMgr result', clusterOpRes);
                const action = `Creating role ${this.state.role}`;

                if (clusterOpRes.success) {
                    this.setState({
                        pending: false,
                        error: null,
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
                error: status.message('Error',
                    `Could not create role ${this.state.role}: ${err}`),
            }))
            .finally(() => this.state.error ? status.toastify(this) : null);
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

    preview() {
        return `CREATE ROLE \`${this.state.role || '(enter role below)'}\` AS COPY OF \`${this.props.role}\``;
    }

    render() {
        return (
            <div className='CopyRoleForm'>
                <Form error={!this.valid()} size="small" style={{ textAlign: 'left' }}>
                    <Form.Group>
                        <h3>Preview</h3>
                        <h4>{this.preview()}</h4>
                    </Form.Group>

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
                        <i className="icon copy" /> Copy
                    </Form.Button>
                </Form>
            </div>
        )
    }
}

CopyRoleForm.props = {
    role: PropTypes.string.isRequired,
};

export default hoc.enterpriseOnlyComponent(CopyRoleForm, 'Copy Role');