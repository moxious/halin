import React, { Component } from 'react';
import './PermissionsPane.css';
import { Grid, Message, Icon } from 'semantic-ui-react';
import Neo4jUsers from './users/Neo4jUsers';
import NewUserForm from './users/NewUserForm';
import sentry from '../sentry/index';
import Neo4jRoles from './roles/Neo4jRoles';
import NewRoleForm from './roles/NewRoleForm';
import uuid from 'uuid';

import 'semantic-ui-css/semantic.min.css';


class PermsWarning extends Component {
    render() {
        return (
            <Message warning icon>
                <Icon name='warning' />
                <Message.Content>
                    Neo4j typically manages users on a per-machine basis.
                    <br/><strong color='red'>Features here will apply changes 
                    across all machines in your cluster</strong>.
                    <br/>To check if your users and roles are consistent across all of your machines,
                    run the advisor in the diagnostics area.
                </Message.Content>
            </Message>
        );
    }
}

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
        // Community doesn't have roles.  So based on this page's layout, the number
        // of columns and components we need depends on if we're enterprise or not.
        // The concept of applying roles to users doesn't work in Community.
        const enterprise = window.halinContext.isEnterprise();
        const columns = enterprise ? 2 : 1;

        return (
            <div className="PermissionsPane">
                <Grid divided='vertically'>
                    { 
                        (window.halinContext && 
                         window.halinContext.members().length > 1) ? 
                            <Grid.Row columns={1}>
                                <Grid.Column><PermsWarning/></Grid.Column>
                            </Grid.Row>
                        : ''
                    }

                    <Grid.Row columns={columns}>
                        <Grid.Column>
                            <NewUserForm
                                key={this.state.key}
                                node={this.props.node}
                                onUserCreate={username => this.event('user', username)} />
                        </Grid.Column>
                        { enterprise ? <Grid.Column>
                            <NewRoleForm
                                key={this.state.key}
                                node={this.props.node}
                                onRoleCreate={role => this.event('role', role)} />
                        </Grid.Column> : '' }
                    </Grid.Row>

                    <Grid.Row columns={columns}>
                        <Grid.Column>
                            <Neo4jUsers
                                key={this.state.key}
                                node={this.props.node}
                                refresh={this.state.childRefresh} />
                        </Grid.Column>
                        { enterprise ? <Grid.Column>
                            <Neo4jRoles
                                key={this.state.key}
                                node={this.props.node}
                                refresh={this.state.childRefresh} />
                        </Grid.Column> : '' }
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>

                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default PermissionsPane;