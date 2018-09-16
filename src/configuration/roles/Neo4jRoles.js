import React, { Component } from 'react';
import CypherDataTable from '../../data/CypherDataTable';
import { Button, Confirm } from 'semantic-ui-react';
import * as PropTypes from "prop-types";
import status from '../../status/index';
import './Neo4jRoles.css';
import styles from '../../styles';

class Neo4jRoles extends Component {
    query = 'call dbms.security.listRoles()';
    static undeleteableRoles = [
        'admin', 'reader', 'architect', 'publisher', 'editor',
    ];

    static canDelete(role) {
        return Neo4jRoles.undeleteableRoles.indexOf(role) === -1;
    }

    displayColumns = [
        {
            Header: 'Delete Role',
            id: 'delete',
            minWidth: 70,
            maxWidth: 100,
            Cell: ({ row }) => (
                <Button compact color='red' style={styles.tinyButton}
                    // Don't let people delete neo4j or admins for now.
                    disabled={!Neo4jRoles.canDelete(row.role)}
                    onClick={e => this.open(row)/*this.deleteUser(e, row)*/}
                    type='submit'>X</Button>
            ),
        },
        { Header: 'Role', accessor: 'role' },
        { Header: 'Users', accessor: 'users' },
    ];

    state = {
        childRefresh: 1,
        refresh: 1,
    }

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    componentWillReceiveProps(props) {
        // If I receive a refresh signal, copy to child
        // which does data polling.  Man I wish there were a better way.
        const refresh = this.state.refresh;
        if (refresh !== props.refresh) {
            this.setState({
                refresh: props.refresh,
                childRefresh: props.refresh,
            });
        }
    }

    deleteRole(row) {
        console.log('DELETE ROLE', row);

        const session = this.driver.session();

        return session.run('call dbms.security.deleteRole({role})', { role: row.role })
            .then(results => {
                this.setState({
                    message: status.message('Success', `Deleted role ${row.role}`),
                    error: null,
                    childRefresh: this.state.childRefresh + 1,
                })
            })
            .catch(err => {
                this.setState({
                    message: null,
                    error: status.message('Error', `Failed to delete role ${row.role}: ${err}`),
                })
            })
            .finally(() => session.close());
    }

    open = (row) => {
        this.setState({ 
            confirmOpen: true,
            activeRole: row,
        });
    };

    confirm = () => {
        const roleToDelete = this.state.activeRole;
        this.setState({ 
            confirmOpen: false,
            activeRole: null,
            message: null,
            error: null,
        });

        return this.deleteRole(roleToDelete);
    }

    close = () => {
        this.setState({ confirmOpen: false });
    }

    render() {
        let message = status.formatStatusMessage(this);

        return (
            <div className="Neo4jRoles">
                <h3>Roles</h3>

                {message}

                <Confirm open={this.state.confirmOpen} onCancel={this.close} onConfirm={this.confirm}/>

                <CypherDataTable   
                    query={this.query}
                    refresh={this.state.childRefresh}
                    displayColumns={this.displayColumns} 
                />
            </div>
        );
    }
}

Neo4jRoles.contextTypes = {
    driver: PropTypes.object,
};

export default Neo4jRoles;