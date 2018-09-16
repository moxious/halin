import React, { Component } from 'react';
import "semantic-ui-css/semantic.min.css";
import './PermissionsPane.css';
import { Grid } from 'semantic-ui-react';
// import HeapComponent from './HeapComponent';
import Neo4jUsers from './users/Neo4jUsers';
import NewUserForm from './users/NewUserForm';

import Neo4jRoles from './roles/Neo4jRoles';
import NewRoleForm from './roles/NewRoleForm';

class PermissionsPane extends Component {
    state = {
        childRefresh: 1,
    };

    event(name, data) {
        console.log('Permissions Event', name, data);
        this.setState({
            childRefresh: this.state.childRefresh + 1,
        })
    }

    render() {
        return (
            <div className="PermissionsPane">
                <Grid divided='vertically'>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <NewUserForm onUserCreate={username => this.event('user', username)}/>
                        </Grid.Column>
                        <Grid.Column>
                            <NewRoleForm onRoleCreate={role => this.event('role', role)}/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <Neo4jUsers refresh={this.state.childRefresh}/>
                        </Grid.Column>
                        <Grid.Column>
                            <Neo4jRoles refresh={this.state.childRefresh}/>
                        </Grid.Column>
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