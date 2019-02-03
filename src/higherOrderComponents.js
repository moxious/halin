/**
 * Higher order components are wrappers we put around other components, in order to express
 * their dependencies / requirements.  For example, some components only work with Neo4j
 * Enterprise, and rather than putting this check in every component, we provide a HOC to
 * wrap something that requires Enterprise.
 * 
 * Generally halin is using these things to express feature requirements the database must
 * have in order for a certain component to work.
 */
import React, { Component } from 'react';
import { Icon, Message } from 'semantic-ui-react';
import Spinner from './Spinner';
import sentry from './sentry';

const smallCentered = { maxWidth: 300, margin: 'auto' };

const clusterOnlyComponent = (WrappedComponent, heading) => {
    return class extends Component {
        render() {
            const nodes = window.halinContext.clusterNodes;

            if (nodes && nodes.length > 1) {
                return <WrappedComponent {...this.props} />;
            }

            return (
                <div className='ClusterOnly'>
                    { heading ? <h3>{heading}</h3> : '' }
                    <Message warning icon style={smallCentered}>
                        <Icon name='warning' />
                        <Message.Content >
                            Only available for Neo4j Clusters
                        </Message.Content>
                    </Message>
                </div>
            )
        }
    }
};

const adminOnlyComponent = (WrappedComponent, heading) => {
    return class extends Component {
        render() {
            const roles = window.halinContext.getCurrentUser().roles;

            // In Neo4j community, there are no roles, effectively
            // everyone is an admin.  So while under community you
            // won't have role='admin', you will have permissions
            // to do stuff.  Weird.            
            if (!window.halinContext.isEnterprise() || roles.indexOf('admin') > -1) {
                return <WrappedComponent {...this.props} />;
            }

            return (
                <div className='AdminOnly'>
                    { heading ? <h3>{heading}</h3> : '' }
                    <Message warning icon style={smallCentered}>
                        <Icon name='warning' />
                        <Message.Content>
                            Only users with role 'admin' may use this function.
                        </Message.Content>
                    </Message>
                </div>
            );
        }
    };
};

const csvMetricsComponent = (WrappedComponent,  heading) => {
    return class extends Component {
        render() {
            if (this.props.node && this.props.node.csvMetricsEnabled()) {
                return <WrappedComponent {...this.props} />;
            }

            return (
                <div className='CSVMetricsOnly'>
                    { heading ? <h3>{heading}</h3> : '' }
                    <Message warning icon style={smallCentered}>
                        <Icon name='warning' />
                        <Message.Content>
                            This feature is only available for databases
                            that have CSV metrics enabled.   See the
                            <a href='https://neo4j.com/docs/operations-manual/current/monitoring/metrics/expose/#metrics-csv'>
                            operations manual section on exposing metrics</a>
                            to configure this for your database.
                        </Message.Content>
                    </Message>
                </div>
            )
        }
    }
};

const apocOnlyComponent = (WrappedComponent, heading) => {
    return class extends Component {
        render() {
            if (window.halinContext.supportsAPOC()) {
                return <WrappedComponent {...this.props} />;
            }

            return (
                <div className='APOCOnly'>
                    { heading ? <h3>{heading}</h3> : '' }
                    <Message warning icon style={smallCentered}>
                        <Icon name='warning' />
                        <Message.Content>
                            This feature is only available for databases
                            that have APOC installed.
                        </Message.Content>
                    </Message>
                </div>
            )
        }
    }
};

/**
 * Compatibility check higher order component.  Wrap your component in this if you need to 
 * check whether certain features are present in order to run.
 * @param {Component} WrappedComponent the component being wrapped.
 * @param {*} compatibilityCheckFn function to call to check for compatibility.  It will be 
 * passed a halin context, and is expected to return a promise which resolves to a boolean. 
 * If true, the wrapped component will be displayed.  If false, the onFailFn will be called.
 * @param {*} onFailFn a function which returns an alternate view if the compatibility check
 * fails.
 */
const compatibilityCheckableComponent = (WrappedComponent, compatibilityCheckFn, onFailFn) => {
    return class extends Component {
        state = { 
            compatible: false,
            pending: true,
        }
        componentDidMount() {
            return compatibilityCheckFn(window.halinContext)
                .then(result => {
                    this.setState({ compatible: result, pending: false });
                })
                .catch(err => {
                    sentry.reportError('Compatibility function failure', err);
                    this.setState({ compatible: false, pending: false });
                });
        }

        render() {
            if (this.state.pending) {
                return <Spinner active='true'/>;
            }

            if (this.state.compatible) {
                return <WrappedComponent {...this.props} />;
            }

            return onFailFn();
        }
    }
}

const enterpriseOnlyComponent = (WrappedComponent, heading) => {
    return class extends Component {
        render() {
            if (window.halinContext.isEnterprise()) {
                return <WrappedComponent {...this.props} />;
            }

            return (
                <div className='EnterpriseOnly'>
                    { heading ? <h3>{heading}</h3> : '' }
                    <Message warning icon style={smallCentered}>
                        <Icon name='warning' />
                        <Message.Content>
                            Only available in Neo4j Enterprise
                        </Message.Content>
                    </Message>
                </div>
            );
        }
    };
}

export default {
    adminOnlyComponent,
    enterpriseOnlyComponent,
    clusterOnlyComponent,
    apocOnlyComponent,
    csvMetricsComponent,
    compatibilityCheckableComponent,
};