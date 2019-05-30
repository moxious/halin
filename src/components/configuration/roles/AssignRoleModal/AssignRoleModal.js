import React, { Component } from 'react';
import { Button, Modal, Dropdown, Grid } from 'semantic-ui-react';
import status from '../../../../api/status/index';
import _ from 'lodash';
import sentry from '../../../../api/sentry/index';

class AssignRoleModal extends Component {
    state = {
        users: [],
        roles: [],
    };

    constructor(props, context) {
        super(props, context);
        this.state.open = props.open;
        this.state.onConfirm = props.onConfirm || (() => null);
        this.state.onCancel = props.onCancel || (() => null);
    }

    cypher(q, params={}) {
        return this.props.node.run(q, params)
            .catch(err => {
                sentry.reportError(err);

                this.setState({
                    pending: false,
                    message: null,
                    error: status.message('Error', `Could not execute cypher: ${err}`),
                }, () => status.toastify(this));
            });
    }

    loadUsers() {
        const getOrDefault = (rec, field, defaultVal=null) => {
            try {
                return rec.get(field);
            } catch (e) {
                return defaultVal;
            }
        };

        return this.cypher('CALL dbms.security.listUsers()')
            .then(results => results.records)
            .then(records => {
                sentry.fine('Got users ', records);
                // Convert to dropdown option format.
                const users = records.map(rec => ({
                    key: rec.get('username'),
                    value: rec.get('username'),
                    text: rec.get('username'),
                    roles: getOrDefault(rec, 'roles', []),
                    username: rec.get('username'),
                }));
                this.setState({ users });
            });
    }

    loadRoles() {
        if (window.halinContext.isCommunity()) {
            // Community doesn't have roles
            return Promise.resolve([]);
        }

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
        sentry.fine('Cancelled user assignment with state', this.state);
        this.setState({ open: false });
        return this.state.onCancel(this);
    };

    removeRole(username, role) {
        const params = { username, role };
        return this.cypher(`
            CALL dbms.security.removeRoleFromUser({role}, {username})
            RETURN null as value
        `, params);
    }

    addRole(username, role) {
        const params = { username, role };
        return this.cypher(`
            CALL dbms.security.addRoleToUser({role}, {username})
            RETURN null as value
        `, params);
    }

    ok = () => {
        const username = this.state.activeUser.username;
        // const oldRoles = this.state.activeUser.roles;
        const newRoles = this.state.activeUser.newRoles;

        const mgr = window.halinContext.getClusterManager();

        return mgr.associateUserToRoles({ username }, newRoles)
            .then(clusterOpRes => this.state.onConfirm(this, clusterOpRes))
            .catch(err => this.state.onConfirm(this, err));
    };

    componentDidMount() {
        this.loadUsers();
        this.loadRoles();
    }

    componentWillReceiveProps(props) {
        if (!_.isNil(props.open)) {
            if (props.open) {
                // Load fresh data each time the dialog opens so that users
                // don't get stale stuff
                this.loadUsers();
                this.loadRoles();
            }

            this.setState({ open: props.open });
        }
    }

    chooseUser = (event, allSelections) => {
        const username = allSelections.value;

        // Create a copy of the user and associate their
        // current roles with 'newRoles'.  This will control
        // what's in the role selection box, and what work has to be done
        // on confirm.
        const foundUser = _.cloneDeep(this.state.users.filter(u => u.username === username)[0]);
        const newRoles = _.cloneDeep(foundUser.roles);
        foundUser.newRoles = newRoles;

        this.setState({ activeUser: foundUser });
        
        sentry.fine('selected user ', allSelections.value);
    };

    formValid = () => this.state.activeUser;

    chooseRole = (event, allSelections) => {
        const newRoleSet = allSelections.value;

        const activeUser = _.cloneDeep(this.state.activeUser);
        activeUser.newRoles = newRoleSet;

        this.setState({ activeUser });
        // sentry.fine('selected role ', newRoleSet);
    };

    render() {
        return (
            <Modal className='AssignRoleModal'
                open={this.state.open}>
                <Modal.Header>Manage User Roles</Modal.Header>
                <Modal.Content>                    
                    <Grid>
                        <Grid.Row columns={2}>
                            <Grid.Column>
                                <h4>Step 1: Select User</h4>

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
                                <h4>Step 2: Assign Roles</h4>

                                {
                                    (this.state.roles && this.state.roles.length > 0) ? 
                                    <Dropdown fluid multiple selection
                                        placeholder='Choose Roles'
                                        disabled={!this.state.activeUser}
                                        value={_.get(this.state.activeUser, 'newRoles') || []}
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

export default AssignRoleModal;
