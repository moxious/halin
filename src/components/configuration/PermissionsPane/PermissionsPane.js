import React, { Component } from 'react';
import './PermissionsPane.css';
import { Grid, Tab } from 'semantic-ui-react';
import Neo4jUsers from '../users/Neo4jUsers/Neo4jUsers';
import sentry from '../../../api/sentry/index';
import Neo4jRoles from '../roles/Neo4jRoles/Neo4jRoles';
import PrivilegesTable from '../privileges/PrivilegesTable/PrivilegesTable';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import uuid from 'uuid';

import hoc from '../../higherOrderComponents';

class PermissionsPane extends Component {
    state = {
        key: uuid.v4(),
        childRefresh: 1,
    };

    event(name, data) {
        sentry.info('Permissions Event', name, data);
        this.setState({
            childRefresh: this.state.childRefresh + 1,
        })
    }

    render() {
        const paneOf = stuff => <Tab.Pane>{stuff}</Tab.Pane>;

        const userPane = {
            menuItem: 'Users',
            render: () => paneOf(
                <Neo4jUsers
                    key={this.state.key}
                    node={this.props.node}
                    refresh={this.state.childRefresh} />),
        };

        const rolesPane = {
            menuItem: 'Roles',
            render: () => paneOf(
                <Neo4jRoles
                    key={this.state.key}
                    node={this.props.node}
                    refresh={this.state.childRefresh} />
            ),
        };

        const privilegesPane = {
            menuItem: 'Privileges',
            render: () => paneOf(
                <PrivilegesTable key={this.state.key}
                    node={this.props.node}
                    refresh={this.state.childRefresh} />
            ),
        };

        const panes = [userPane];
        const enterprise = window.halinContext.isEnterprise();
        const is4 = window.halinContext.getVersion().major >= 4;

        if (enterprise) { panes.push(rolesPane); }
        if (enterprise && is4) { panes.push(privilegesPane); }

        return (
            <Tab panes={panes} className='PermissionsPane' />
        );
    }

    __render() {
        // Community doesn't have roles.  So based on this page's layout, the number
        // of columns and components we need depends on if we're enterprise or not.
        // The concept of applying roles to users doesn't work in Community.
        const enterprise = window.halinContext.isEnterprise();
        const columns = enterprise ? 2 : 1;

        return (
            <div className="PermissionsPane">
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <h3>Permissions Management
                                <Explainer knowledgebase='UserManagement' />
                            </h3>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={columns}>
                        <Grid.Column>
                            <Neo4jUsers
                                key={this.state.key}
                                node={this.props.node}
                                refresh={this.state.childRefresh} />
                        </Grid.Column>
                        {enterprise ? <Grid.Column>
                            <Neo4jRoles
                                key={this.state.key}
                                node={this.props.node}
                                refresh={this.state.childRefresh} />
                        </Grid.Column> : ''}
                    </Grid.Row>

                    <Grid.Row>
                        <Grid.Column>
                            <PrivilegesTable key={this.state.key}
                                node={this.props.node}
                                refresh={this.state.childRefresh} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default hoc.contentPaneComponent(PermissionsPane);