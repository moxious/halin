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

const missingFeatureMessage = (heading, message) => {
    return (
        <div className='MissingFeature'>
            { heading ? <h3>{heading}</h3> : '' }
            <Message warning icon style={smallCentered}>
                <Icon name='warning' />
                <Message.Content>{ message }</Message.Content>
            </Message>
        </div>
    );
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

const apocOnlyComponent = (WrappedComponent, heading) => {
    const failMsg = 'This feature is only available for databases that have APOC installed.';
    const compatCheck = ctx => Promise.resolve(ctx.supportsAPOC());

    return compatibilityCheckableComponent(
        WrappedComponent, 
        compatCheck,
        () => missingFeatureMessage(heading, failMsg)
    );
};

const enterpriseOnlyComponent = (WrappedComponent, heading) => {
    const failMsg = 'Only available in Neo4j Enterprise';
    const compatCheck = ctx => Promise.resolve(ctx.isEnterprise());

    return compatibilityCheckableComponent(
        WrappedComponent, 
        compatCheck,
        () => missingFeatureMessage(heading, failMsg)
    );
};

const csvMetricsComponent = (WrappedComponent,  heading) => {
    const failMsg = <div>
        This feature is only available for databases
        that have CSV metrics enabled.   See the
        <a href='https://neo4j.com/docs/operations-manual/current/monitoring/metrics/expose/#metrics-csv'>
        operations manual section on exposing metrics</a>
        to configure this for your database.
    </div>;
    const compatCheck = ctx => Promise.resolve(this.props.node && this.props.node.csvMetricsEnabled());

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg)
    );
};

const clusterOnlyComponent = (WrappedComponent, heading) => {
    const failMsg = 'Only available for Neo4j Clusters';
    const compatCheck = ctx => Promise.resolve(ctx.members() && ctx.members().length > 1);

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg)
    );
};

const adminOnlyComponent = (WrappedComponent, heading) => {
    const failMsg = "Only users with role 'admin' may use this function";

    // In Neo4j community, there are no roles, effectively
    // everyone is an admin.  So while under community you
    // won't have role='admin', you will have permissions
    // to do stuff.  Weird.
    const compatCheck = ctx => Promise.resolve(!ctx.isEnterprise() || ctx.getCurrentUser().roles.indexOf('admin') > -1);

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg)
    );
};

const dbStatsOnlyComponent = (WrappedComponent, heading) => {
    const failMsg = 'Only available in versions of Neo4j which support db.stats (Neo4j 3.5.2 and above)';
    const compatCheck = ctx => Promise.resolve(ctx.supportsDBStats());

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg)
    );
};

export default {
    adminOnlyComponent,
    enterpriseOnlyComponent,
    clusterOnlyComponent,
    apocOnlyComponent,
    csvMetricsComponent,
    compatibilityCheckableComponent,
    dbStatsOnlyComponent,
};