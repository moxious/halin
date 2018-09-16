import React, { Component } from 'react';
import CypherDataTable from '../../data/CypherDataTable';
import * as PropTypes from 'prop-types';
import { Button, Confirm } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import status from '../../status/index';
import './Neo4jUsers.css';
import AssignRoleModal from '../roles/AssignRoleModal';
// import Neo4jRoles from '../roles/Neo4jRoles';
import styles from '../../styles';

class Neo4jUsers extends Component {
    query = 'call dbms.security.listUsers()';
    displayColumns = [
        {
            Header: 'Delete',
            id: 'delete',
            minWidth: 70,
            maxWidth: 100,
            Cell: ({ row }) => (
                <Button compact color='red' style={styles.tinyButton}
                    // Don't let people delete neo4j or admins for now.
                    disabled={row.username === 'neo4j' || row.roles.indexOf('admin') > -1}
                    onClick={e => this.open(row)}
                    type='submit'>X</Button>
            ),
        },
        { 
            Header: 'Username', 
            accessor: 'username',
        },
        { 
            Header: 'Roles', 
            accessor: 'roles',
            Cell: ({ row }) => row.roles.map((role, idx) => (
                <div className='role' key={idx}>
                    { role }{ idx < row.roles.length -1 ? ',' : '' }
                    {/* Working on it. */}
                    {/* <Button compact style={styles.tinyButton}
                        disabled={!Neo4jRoles.canDelete(role)} 
                        color='red'>X</Button> */}
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
        console.log('DELETE USER ', row);

        const session = this.driver.session();

        return session.run('call dbms.security.deleteUser({username})', { username: row.username })
            .then(results => {
                // Just increment refresh to any other value, signals to child to reload data.
                this.setState({
                    message: {
                        header: 'Success',
                        body: `Deleted user ${row.username}`,
                    },
                    error: null,
                    childRefresh: this.state.childRefresh + 1
                });
            })
            .catch(err => {
                this.setState({
                    message: null,
                    error: {
                        header: 'Error',
                        body: `Failed to delete ${row.username}: ${err}`,
                    },
                });
            })
            .finally(() => session.close);
    }

    openAssign = (row) => {
        this.setState({
            assignOpen: true,
            activeUser: row,
        });
    };

    confirmRoleAssignment = (component, message) => {
        this.refresh();
        this.setState({
            assignOpen: false,
            message,
        });
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

        return (
            <div className="Neo4jUsers">
                <h3>Users</h3>
                
                <Button basic color='green' onClick={e => this.openAssign()}>
                    Manage User Roles
                </Button>
                <Button basic color='green' onClick={e => this.refresh()}>
                    Refresh
                </Button>

                { message }

                <AssignRoleModal open={this.state.assignOpen}
                    onCancel={this.closeAssign}
                    onConfirm={this.confirmRoleAssignment}/>

                {/* <Confirm open={this.state.assignOpen} 
                    content='Not yet implemented.  Getting there!'
                    onCancel={this.closeAssign} 
                    onConfirm={this.closeAssign}/> */}

                <Confirm 
                    header='Delete User'
                    content='Are you sure? This action cannot be undone!'
                    open={this.state.confirmOpen} 
                    onCancel={this.close} 
                    onConfirm={this.confirm}/>

                <CypherDataTable
                    showPagination={true}
                    query={this.query}
                    refresh={this.state.childRefresh}
                    displayColumns={this.displayColumns}
                />
            </div>
        );
    }
}

Neo4jUsers.contextTypes = {
    driver: PropTypes.object,
};

export default Neo4jUsers;