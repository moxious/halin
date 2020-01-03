import React, { Component } from 'react';
import CypherDataTable from '../../../data/CypherDataTable/CypherDataTable';
import { Button, Confirm, Grid, Modal, Icon, Popup } from 'semantic-ui-react';
import uuid from 'uuid';
import moment from 'moment';
import halin from '../../../../api';
import sentry from '../../../../api/sentry/index';
import status from '../../../../api/status/index';

import AssignRoleModal from '../../roles/AssignRoleModal/AssignRoleModal';
import './Neo4jUsers.css';
import CSVDownload from '../../../data/download/CSVDownload';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';
import NewUserForm from '../NewUserForm/NewUserForm';
import ChangePasswordForm from '../ChangePasswordForm/ChangePasswordForm';

class Neo4jUsers extends Component {
    key = uuid.v4();
    query = 'call dbms.security.listUsers()';
    displayColumns = [
        {
            Header: 'Actions',
            id: 'delete',
            minWidth: 70,
            maxWidth: 100,
            Cell: ({ row }) => (
                <span>
                    {this.deleteUserButton(row)}
                    {this.changeUserPasswordButton(row)}
                </span>
            ),
        },
        {
            Header: 'Username',
            accessor: 'username',
        },
        {
            // #operabilty - major pain that the return type of this procedure is 
            // different between enterprise and community.  Would be better if 
            // community always return roles [].  As such, the field doesn't exist.
            Header: 'Roles',
            accessor: 'roles',
            absentValue: [],
            // In community roles may not exist, so default to []
            Cell: ({ row }) => (row.roles || []).map((role, idx) => (
                <div className='role' key={idx}>
                    {role}{idx < row.roles.length - 1 ? ',' : ''}
                </div>
            )),
            show: window.halinContext.isEnterprise(),
        },
        {
            Header: 'Flags',
            accessor: 'flags',
        },
    ];

    state = {
        childRefresh: 1,
        refresh: 1,
        message: null,
        error: null,
    };

    deleteUserButton(row) {
        return (
            <Popup content='Delete User'
                trigger={
                    <Button compact negative
                        // Don't let people delete neo4j or admins for now.
                        disabled={row.username === 'neo4j' || (row.roles || []).indexOf('admin') > -1}
                        onClick={e => this.open(row)}
                        type='submit' icon="cancel" />
                } />
        );
    }

    changeUserPasswordButton(row) {
        // This is lame, but the necessary stored procedure isn't present in 
        // Community.
        if (!window.halinContext.isEnterprise()) {
            return '';
        }

        const button = <Button compact type='submit' icon='key' />;

        return (
            <Modal closeIcon
                trigger={button}>
                <Modal.Header>Change Password for User {row.username}</Modal.Header>

                <Modal.Content>
                    <ChangePasswordForm {...row} />
                </Modal.Content>
            </Modal>
        );
    }

    changePassword(row) {
        console.log('Change Password', row);
    }

    refresh(val = (this.state.refresh + 1)) {
        // These are passed by state to child components, updating it, 
        // because child component data table is watching, has the effect to
        // force refresh its data.
        this.setState({
            refresh: val,
            childRefresh: val,
            message: null,
            error: null,
        });
    }

    UNSAFE_componentWillReceiveProps(props) {
        // If I receive a refresh signal, copy to child
        // which does data polling.  Man I wish there were a better way.
        const refresh = this.state.refresh;
        if (refresh !== props.refresh) {
            this.refresh(props.refresh);
        }
    }

    deleteUser(row) {
        sentry.info('DELETE USER ', row);

        const mgr = window.halinContext.getClusterManager();

        return mgr.deleteUser(row)
            .then(clusterOpRes => {
                sentry.info('ClusterMgr result', clusterOpRes);
                const action = `Deleting user ${row.username}`;

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
                    `Could not delete user ${row.username}: ${err}`),
            }))
            .finally(() => status.toastify(this));
    }

    openAssign = (row) => {
        this.setState({
            assignOpen: true,
            activeUser: row,
        });
    };

    confirmRoleAssignment = (component, clusterOpResult) => {
        this.refresh();
        sentry.fine('ClusterOpResult', clusterOpResult);
        const action = `Assigning roles`;

        let newState = {};

        if (clusterOpResult instanceof Error) {
            newState = {
                assignOpen: false,
                message: null,
                error: status.message(`Error on ${action}`,
                    `${clusterOpResult}`),
            };
        } else if (clusterOpResult.success) {
            newState = {
                assignOpen: false,
                message: status.fromClusterOp(action, clusterOpResult),
                error: false,
            };
        } else {
            newState = {
                assignOpen: false,
                message: null,
                error: status.fromClusterOp(action, clusterOpResult),
            };
        }

        // Fire the toast message after update is complete.
        this.setState(newState, () => status.toastify(this));
    }

    closeAssign = () => {
        this.setState({ assignOpen: false });
    };

    open = (row) => {
        this.setState({
            confirmOpen: true,
            activeUser: row,
        });
    };

    confirm = () => {
        const userToDelete = this.state.activeUser;
        this.setState({
            confirmOpen: false,
            activeUser: null,
        });

        return this.deleteUser(userToDelete);
    }

    close = () => {
        this.setState({ confirmOpen: false });
    }

    onRecordsUpdate = (records /*, component */) => {
        this.setState({ data: records });
    };

    downloadCSVButton() {
        if (!this.state.data || this.state.data.length === 0) {
            return '';
        }

        return (
            <CSVDownload
                title='Download'
                filename={`Halin-neo4j-users-${moment.utc().format()}.csv`}
                data={this.state.data}
                displayColumns={this.displayColumns}
            />
        );
    }

    addUserButton() {
        return (
            <Modal closeIcon
                trigger={
                    <Button primary>
                        <Icon name='add' color='green' /> Add User
                    </Button>
                }>
                <Modal.Header>Create New User</Modal.Header>

                <Modal.Content>
                    <NewUserForm
                        node={this.props.node}
                        onUserCreate={() => this.refresh()} />
                </Modal.Content>
            </Modal>
        );
    }

    manageRolesButton() {
        // #operability: Aura standard does not support role management
        if (!window.halinContext.supportsRoles()) {
            // Does not apply.
            return '';
        }

        return (
            <Button onClick={e => this.openAssign()}>
                <i className="icon user"></i> Manage
            </Button>
        );
    }

    render() {
        return (
            <div className="Neo4jUsers">
                <h3>Users <Explainer knowledgebase='Users' /></h3>

                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Button.Group size='small'>
                                {this.addUserButton()}
                                {this.manageRolesButton()}
                                {this.downloadCSVButton()}
                                <Button onClick={e => this.refresh()} icon="refresh" />
                            </Button.Group>
                        </Grid.Column>
                    </Grid.Row>

                    {window.halinContext.supportsRoles() ? <AssignRoleModal key={this.key}
                        node={this.props.node}
                        open={this.state.assignOpen}
                        onCancel={this.closeAssign}
                        onConfirm={this.confirmRoleAssignment} /> : ''}

                    {/* <Confirm open={this.state.assignOpen} 
                    content='Not yet implemented.  Getting there!'
                    onCancel={this.closeAssign} 
                    onConfirm={this.closeAssign}/> */}

                    <Confirm
                        header='Delete User'
                        content='Are you sure? This action cannot be undone!'
                        open={this.state.confirmOpen}
                        onCancel={this.close}
                        onConfirm={this.confirm} />

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <CypherDataTable
                                node={this.props.node}
                                onUpdate={this.onRecordsUpdate}
                                showPagination={true}
                                query={this.query}
                                refresh={this.state.childRefresh}
                                defaultPageSize={10}
                                database={halin.driver.SYSTEM_DB}
                                displayColumns={this.displayColumns}
                                hideMemberLabel={true}
                            />
                        </Grid.Column>
                    </Grid.Row>

                </Grid>
            </div>
        );
    }
}

export default Neo4jUsers;