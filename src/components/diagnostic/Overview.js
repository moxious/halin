import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Message } from 'semantic-ui-react';
import { Image, Grid } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import ClusterMember from '../../api/cluster/ClusterMember';
import _ from 'lodash';
import './Overview.css';
import sentry from '../../api/sentry/index';
import neo4jErrors from '../../api/driver/errors';

/**
 * @deprecated
 * This doesn't add much value but won't be removed yet.  Many aspects of this component
 * can be pre-loaded by HalinContext and put in the settings menu.
 */
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

    getClusterStatus() {
        const s1 = this.driver.session();
        return s1.run('CALL dbms.cluster.overview()', {})
            .then(results => {
                const clusterMembers = results.records.map(rec => new ClusterMember(rec));
                this.setState({ mode: 'CLUSTER', topology: clusterMembers });
            })
            .catch(err => {
                if (neo4jErrors.noProcedure(err)) {
                    this.setState({ mode: 'SINGLE', clusterInfo: null });
                } else {
                    sentry.reportError(err, 'CLUSTER ERROR');
                }
            })            
            .finally(() => s1.close());
    }

    getUser() {
        if (!window.halinContext.supportsAuth()) {
            // You can't get current user information when auth isn't supported
            // So just set the user to a dummy neo4j instance.
            const user = {
                username: '(none)',
                roles: [],
                flags: [],
            };
            this.setState({ user });
            return Promise.resolve(true);
        }

        const q = 'call dbms.showCurrentUser()';

        const session = this.driver.session();
        return session.run(q, {})
            .then(results => {
                const rec = results.records[0];
                let roles = ['(none)'];
                
                // Community doesn't expose roles
                try { roles = rec.get('roles'); }                
                catch (e) { } // eslint-disable-line no-empty

                const user = {
                    username: rec.get('username'),
                    roles,
                    flags: rec.get('flags'),
                };

                this.setState({ user });
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
            .catch(err => sentry.reportError(err, 'Failed to get DB components'))
            .finally(() => session.close());
    }

    componentDidMount() {
        return Promise.all([
            this.getDBComponents(), 
            this.getClusterStatus(),
            this.getUser(),
        ]);
    }

    renderTopology() {
        if (!this.state.topology) { return ''; }

        return (
            <ul>
                {
                    this.state.topology.map((clusterMember, key) => 
                        <li key={key}>
                            {clusterMember.getAddress()}: {clusterMember.role}, supporting protocols
                            &nbsp;{clusterMember.protocols().join(', ')}
                        </li>)
                }
            </ul>
        )
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
                                        <li>Database is running in mode {this.state.mode}</li>
                                        <li>Halin is running under user&nbsp;
                                            <strong>
                                                {(_.get(this.state.user, 'username') || 'loading...')}
                                            </strong> 
                                            &nbsp;with roles&nbsp;
                                            <strong>
                                                {(_.get(this.state.user, 'roles') || ['(none)']).join(', ')}
                                            </strong>
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