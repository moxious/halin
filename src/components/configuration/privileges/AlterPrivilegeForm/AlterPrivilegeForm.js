import React, { Component } from 'react';
import { Form } from 'semantic-ui-react';
import status from '../../../../api/status/index';
import sentry from '../../../../api/sentry/index';
import uuid from 'uuid';
import PrivilegeOperation from '../../../../api/cluster/PrivilegeOperation';
import Spinner from '../../../ui/scaffold/Spinner/Spinner';
import _ from 'lodash';

// Put a string into the right format for a react dropdown option.
const optionify = v =>
    ({ key: uuid.v4(), text: v, value: v });

class AlterPrivilegeForm extends Component {
    state = {
        pending: false,
        message: null,
        error: null,
        formError: null,
        operation: 'GRANT',
        privilege: 'TRAVERSE',
        entity: 'NODES *',
        role: 'admin',
        op: null,
        operations: ['GRANT', 'REVOKE', 'DENY'].map(optionify),
        privileges: ['TRAVERSE', 'READ (*)', 'MATCH (*)', 'WRITE (*)'].map(optionify),
        entities: ['NODES *', 'RELATIONSHIPS *', 'ELEMENTS *'].map(optionify),
    };

    constructor(props, context) {
        super(props, context);
        this.onModify = props.onModify || (() => null);
    }

    valid() {
        return this.state.op && _.isNil(this.state.op.validate());
    }

    componentWillMount() {
        const mgr = window.halinContext.getClusterManager();
        // Load roles for dropdown content.
        this.setState({ pending: true });
        return mgr.getRoles()
            .then(roleData => {
                console.log('MY PROPS', this.props);
                const roles = roleData.map(entry => optionify(entry.role));

                const databases = mgr.databases().map(db => optionify(db.getLabel()))
                    .concat([optionify('*')]);

                const database = this.props.database || databases[0].value;
                const role = this.props.role || roles[0].value;
                const privilege = this.props.privilege || 'TRAVERSE';
                const operation = (this.props.operation || '').toUpperCase() || 'GRANT';
                const entity = this.props.entity || 'NODES *';

                const op = new PrivilegeOperation({
                    database, role, privilege, operation, entity,
                });

                return this.setState({
                    database,
                    role,
                    privilege,
                    operation,
                    entity,
                    op,
                    roles,
                    databases,
                });
            })
            .catch(err => {
                sentry.error('Failed to get roles for pre-population', err);
            })
            .finally(() => this.setState({ pending: false }));
    }

    submit(event) {
        sentry.fine('submit', this.state);
        event.preventDefault();

        const mgr = window.halinContext.getClusterManager();
        const action = this.state.op.buildQuery();

        return mgr.alterPrivilege(this.state.op)
            .then((clusterOpRes) => {
                this.setState({
                    pending: false,
                    message: status.fromClusterOp(action, clusterOpRes),
                    error: null,
                });
            })
            .catch(err => {
                sentry.error('Privilege Error', err);
                this.setState({
                    pending: false,
                    message: null,
                    error: status.message('Error',
                        `Could not ${action}: ${err}`),
                });
            })
            .finally(() => status.toastify(this));
    }

    handleChange(field, event, data) {
        console.log('handleChange', field, data.value);

        const oldStuff = _.pick(this.state, [
            'operation', 'privilege', 'database', 'entity', 'role',
        ]);

        // Override with change
        const newFields = _.merge(oldStuff, { [field]: data.value });
        const op = new PrivilegeOperation(newFields);
        newFields.op = op;

        this.setState(newFields);
    }

    inputStyle = {
        minWidth: '150px',
        paddingTop: '10px',
        paddingBottom: '10px',
    };

    queryBuilderFormGroup() {
        return (
            <Form.Group widths='equal'>
                <Form.Select
                    fluid
                    options={this.state.operations}
                    placeholder='Operation'
                    style={this.inputStyle}
                    disabled={this.state.pending}
                    defaultValue={this.state.operation}
                    label='Action'
                    onChange={(e, d) => this.handleChange('operation', e, d)} />

                <Form.Select
                    fluid
                    options={this.state.privileges}
                    style={this.inputStyle}
                    disabled={this.state.pending}
                    defaultValue={this.state.privilege}
                    onChange={(e, d) => this.handleChange('privilege', e, d)}
                    label='Privilege'
                    placeholder='MATCH (*)'
                />

                <Form.Select
                    fluid
                    options={this.state.databases}
                    style={this.inputStyle}
                    disabled={this.state.pending}
                    defaultValue={this.state.database}
                    onChange={(e, d) => this.handleChange('database', e, d)}
                    label='ON DATABASE'
                />

                <Form.Select
                    fluid
                    options={this.state.entities}
                    style={this.inputStyle}
                    disabled={this.state.pending}
                    defaultValue={this.state.entity}
                    onChange={(e, d) => this.handleChange('entity', e, d)}
                    label='Entity'
                />

                <Form.Select
                    fluid
                    options={this.state.roles}
                    placeholder='role'
                    label='TO ROLE'
                    style={this.inputStyle}
                    disabled={this.state.pending}
                    defaultValue={this.state.role}
                    onChange={(e, d) => this.handleChange('role', e, d)} />
            </Form.Group>
        );
    }

    render() {
        if (this.state.pending) {
            return (<Spinner />);
        }

        const negative = this.state.operation === 'DENY' || this.state.operation === 'REVOKE';

        return (
            <div className='AlterPrivilegeForm'>
                <Form size="small" error={!this.valid()} style={{ textAlign: 'left' }}>
                    <Form.Group>
                        <h3>Preview</h3>
                        <h4>{new PrivilegeOperation(this.state).buildQuery()}</h4>
                    </Form.Group>

                    {!this.props.locked ? this.queryBuilderFormGroup() : ''}

                    <Form.Button positive={!negative} negative={negative}
                        style={this.inputStyle}
                        disabled={this.state.pending || !this.valid()}
                        onClick={data => this.submit(data)}
                        type='submit'>
                        <i className="icon lock" /> Alter Privileges
                    </Form.Button>
                </Form>
            </div>
        )
    }
}

export default AlterPrivilegeForm;