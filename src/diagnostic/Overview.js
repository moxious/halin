import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Message } from 'semantic-ui-react';
import { Image, Grid } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import _ from 'lodash';
import './Overview.css';

class Overview extends Component {
    state = {
        name: null,
        versions: null,
        edition: null,
        topology: null,
        mode: null,
        address: null,
        user: null,
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    getClusterStatus() {
        const s1 = this.driver.session();
        return s1.run('CALL dbms.cluster.overview()', {})
            .then(results => {
                console.log('CLUSTER RESULTS',results);
                this.setState({ mode: 'CLUSTER', topology: results });
            })
            .catch(err => {
                const str = `${err}`;
                if (str.indexOf('no procedure') > -1) {
                    this.setState({ mode: 'SINGLE', clusterInfo: null });
                } else {
                    console.error('CLUSTER ERROR', err);    
                }
            })            
            .finally(() => s1.close());
    }

    getUser() {
        const q = 'call dbms.showCurrentUser()';

        const session = this.driver.session();
        return session.run(q, {})
            .then(results => {
                const rec = results.records[0];
                const user = {
                    username: rec.get('username'),
                    roles: rec.get('roles'),
                    flags: rec.get('flags'),
                };

                this.setState({ user });
            })
            .catch(err => {
                console.error('Failed to get user info', err);
            })
            .finally(() => session.close());
    }

    getAddress() {
        const q = `
            call dbms.listConfig() 
            yield name, value 
            where name='dbms.connectors.default_advertised_address' 
            return value;
        `;
        const session = this.driver.session();
        return session.run(q, {})
            .then(results => {
                const address = results.records[0].get('value');
                this.setState({ address });
            })
            .catch(err => {
                console.error('Failed to get node address', err);
            })
            .finally(() => session.close());
    }

    getDBComponents() {
        const session = this.driver.session();
        return session.run('CALL dbms.components()', {})
            .then(results => {
                const rec = results.records[0];

                this.setState({
                    name: rec.get('name'),
                    versions: rec.get('versions'),
                    edition: rec.get('edition'),
                });
            })
            .catch(err => {
                console.error('Failed to get DB components', err);
            })
            .finally(() => session.close());
    }

    componentDidMount() {
        return Promise.all([
            this.getDBComponents(), 
            this.getClusterStatus(),
            this.getAddress(),
            this.getUser(),
        ]);
    }

    render() {
        return (
            (this.state.name && this.state.mode) ? (
                <div className='Overview'>
                    <Message>
                        <Message.Header>
                                        Neo4j {this.state.edition} version(s) {this.state.versions.join(', ')}            
                        </Message.Header>
                        <Grid>
                            <Grid.Row columns={3}>
                                <Grid.Column>
                                    <Image style={{display:'block', marginLeft:0, marginRight: 'auto'}} size='tiny' src='img/neo4j_logo_globe.png' />
                                </Grid.Column>
                                <Grid.Column textAlign='left'>
                                    <ul>
                                        <li>Database is running in mode {this.state.mode} on {this.state.address}</li>
                                        <li>Halin is running under user&nbsp;
                                            {(_.get(this.state.user, 'username') || 'loading...')} 
                                            &nbsp;with roles&nbsp;
                                            {(_.get(this.state.user, 'roles') || ['(none)']).join(', ')}
                                            {
                                                _.get(this.state.user, 'flags') ? (
                                                    ' and flags: ' + (
                                                        this.state.user.flags.length > 0 ? 
                                                        this.state.user.flags.join(', ') :
                                                        '(none)')
                                                ) : ''
                                            }
                                        </li>
                                    </ul>                                    
                                </Grid.Column>
                                <Grid.Column>
                                    <Image style={{display:'block', marginLeft:'auto', marginRight: 0}} size='tiny' src='img/neo4j_logo_globe.png' />
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Message>
                </div>
            ) : 'Loading...'
        );
    }
}

Overview.contextTypes = {
    driver: PropTypes.object,
};

export default Overview;