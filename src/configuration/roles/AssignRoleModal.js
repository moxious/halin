import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Button, Modal, Dropdown, Grid } from 'semantic-ui-react';
import status from '../../status/index';
import _ from 'lodash';

class AssignRoleModal extends Component {
    state = {
        users: [],
        roles: [],
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
        this.state.open = props.open;
        this.state.onConfirm = props.onConfirm || (() => null);
        this.state.onCancel = props.onCancel || (() => null);
    }

    cypher(q, params={}) {
        const session = this.driver.session();

        return session.run(q, params)
            .catch(err => {
                this.setState({
                    pending: false,
                    message: null,
                    error: status.message('Error', `Could not execute cypher: ${err}`),
                });
            })
            .finally(() => session.close());
    }

    loadUsers() {
        return this.cypher('CALL dbms.security.listUsers()')
            .then(results => results.records)
            .then(records => {

                // Convert to dropdown option format.
                const users = records.map(rec => ({
                    key: rec.get('username'),
                    value: rec.get('username'),
                    text: rec.get('username'),
                    roles: rec.get('roles'),
                    username: rec.get('username'),
                }));
                this.setState({ users });
            });
    }

    loadRoles() {
        return this.cypher('CALL dbms.security.listRoles()')
            .then(results => results.records)
            .then(records => {
                // Convert to dropdown option format.
                const roles = records.map(rec => ({
                    key: rec.get('role'),
                    value: rec.get('role'),
                    text: rec.get('role'),
                    role: rec.get('role'),
                }));
                this.setState({ roles });
            });
    }

    cancel = () => {
        console.log('Cancelled user assignment with state', this.state);
        this.setState({ open: false });
        return this.state.onCancel(this);
    };

    ok = () => {
        console.log('OK would trigger assignment of ', this.state.activeUser, 'to', this.state.activeRole);

        const q = 'CALL dbms.security.addRoleToUser({roleName}, {username})';
        const params = {
            username: this.state.activeUser.username,
            roleName: this.state.activeRole.role,
        };

        // If cypher fails we will show err message in modal.
        return this.cypher(q, params)
            .then(() => {
                // Returns nothing on success.
                this.setState({ open: false });

                // Fire callback to parent.
                const result = _.merge(
                    status.message('Success', `Assigned ${params.username} to role ${params.roleName}`), 
                    params);
                
                return this.state.onConfirm(this, result);
            });
    };

    componentDidMount() {
        this.loadUsers();
        this.loadRoles();
    }

    componentWillReceiveProps(props) {
        if (!_.isNil(props.open)) {
            this.setState({ open: props.open });
        }
    }

    chooseUser = (event, allSelections) => {
        const username = allSelections.value;

        this.setState({
            activeUser: this.state.users.filter(u => u.username === username)[0],
        });
        
        console.log('selected user ', allSelections.value);
    };

    formValid = () => this.state.activeUser && this.state.activeRole;

    chooseRole = (event, allSelections) => {
        const role = allSelections.value;

        this.setState({
            activeRole: this.state.roles.filter(r => r.role === role)[0],
        });

        console.log('selected role ', allSelections.value);
    };

    render() {
        const message = status.formatStatusMessage(this);

        return (
            <Modal className='AssignRoleModal'
                open={this.state.open}>
                <Modal.Header>Assign Users Roles</Modal.Header>
                <Modal.Content>
                    
                    { message }

                    <Grid>
                        <Grid.Row columns={2}>
                            <Grid.Column>
                                <h4>Select User</h4>

                                {
                                    (this.state.users && this.state.users.length > 0) ?
                                    <Dropdown 
                                        placeholder='Select user' fluid selection 
                                        onChange={this.chooseUser}
                                        options={this.state.users}/> : 
                                    'Loading users...'
                                }
                            </Grid.Column>

                            <Grid.Column>
                                <h4>Select Role</h4>

                                {
                                    (this.state.roles && this.state.roles.length > 0) ? 
                                    <Dropdown 
                                        placeholder='Select role' fluid selection 
                                        onChange={this.chooseRole}
                                        options={this.state.roles}/> :
                                    'Loading roles...'
                                }
                            </Grid.Column>    
                        </Grid.Row>
                    </Grid>
                </Modal.Content>

                <Modal.Actions>
                    <Button basic color='red' onClick={this.cancel}>
                        Cancel
                    </Button>
                    <Button basic color='green' disabled={!this.formValid()} onClick={this.ok}>
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

AssignRoleModal.contextTypes = {
    driver: PropTypes.object
};

export default AssignRoleModal;
