import React, { Component } from 'react';
import CypherDataTable from '../../data/CypherDataTable';
import { Button, Confirm, Grid } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import status from '../../status/index';
import AssignRoleModal from '../roles/AssignRoleModal';
import uuid from 'uuid';
import sentry from '../../sentry/index';
import './Neo4jUsers.css';

class Neo4jUsers extends Component {
    key = uuid.v4();
    query = 'call dbms.security.listUsers()';
    displayColumns = [
        {
            Header: 'Delete',
            id: 'delete',
            minWidth: 70,
            maxWidth: 100,
            Cell: ({ row }) => (
                <Button compact negative
                    // Don't let people delete neo4j or admins for now.
                    disabled={row.username === 'neo4j' || row.roles.indexOf('admin') > -1}
                    onClick={e => this.open(row)}
                    type='submit' icon="cancel"/>
            ),
        },
        {
            Header: 'Username',
            accessor: 'username',
        },
        {
            Header: 'Roles',
            accessor: 'roles',
            absentValue: [],
            Cell: ({ row }) => row.roles.map((role, idx) => (
                <div className='role' key={idx}>
                    {role}{idx < row.roles.length - 1 ? ',' : ''}
                </div>
            )),
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
    }

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
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

    componentWillReceiveProps(props) {
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
            }));
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
        const action = `Assign roles`;

        if (clusterOpResult instanceof Error) {
            this.setState({
                assignOpen: false,
                message: null,
                error: status.message(`Error on ${action}`,
                    `${clusterOpResult}`),
            });
        } else if (clusterOpResult.success) {
            this.setState({
                assignOpen: false,
                message: status.fromClusterOp(action, clusterOpResult),
                error: false,
            });
        } else {
            this.setState({
                assignOpen: false,
                message: null,
                error: status.fromClusterOp(action, clusterOpResult),
            });
        }
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

    render() {
        let message = status.formatStatusMessage(this);
        const enterprise = window.halinContext.isEnterprise();

        return (
            <div className="Neo4jUsers">
                <h3>Users</h3>

                <Grid>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            {message || 'Browse, filter, and delete users'}
                        </Grid.Column>
                        <Grid.Column>
                            { enterprise ? 
                                <Button basic onClick={e => this.openAssign()}>
                                    <i className="icon user"></i> Manage Roles
                                </Button> : '' }
                            
                            <Button basic onClick={e => this.refresh()} icon="refresh"/>
                        </Grid.Column>
                    </Grid.Row>

                    { window.halinContext.isEnterprise() ? <AssignRoleModal key={this.key}
                        driver={this.props.driver}
                        node={this.props.node}
                        open={this.state.assignOpen}
                        onCancel={this.closeAssign}
                        onConfirm={this.confirmRoleAssignment} /> : '' }

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
                                driver={this.props.driver}
                                node={this.props.node}
                                showPagination={true}
                                query={this.query}
                                refresh={this.state.childRefresh}
                                displayColumns={this.displayColumns}
                            />
                        </Grid.Column>
                    </Grid.Row>

                </Grid>
            </div>
        );
    }
}

export default Neo4jUsers;