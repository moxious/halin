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

import Spinner from './ui/scaffold/Spinner/Spinner';
import HalinCard from './ui/scaffold/HalinCard/HalinCard';
import sentry from '../api/sentry';

const smallCentered = { maxWidth: 300, margin: 'auto' };

const missingFeatureMessage = (heading, message, halinCard) => {
    const warning = (
        <Message warning icon style={smallCentered}>
            <Icon name='warning' />
            <Message.Content>{ message }</Message.Content>
        </Message>
    );

    if (halinCard) {
        return (
            <HalinCard header={heading}>
                { warning }
            </HalinCard>
        );
    }

    return (
        <div className='MissingFeature'>
            { heading ? <h3>{heading}</h3> : '' }
            { warning }
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
};

const apocOnlyComponent = (WrappedComponent, heading, halinCard=true) => {
    const failMsg = 'This feature is only available for databases that have APOC installed.';
    const compatCheck = ctx => Promise.resolve(ctx.supportsAPOC());

    return compatibilityCheckableComponent(
        WrappedComponent, 
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

const enterpriseOnlyComponent = (WrappedComponent, heading, halinCard=true) => {
    const failMsg = 'Only available in Neo4j Enterprise';
    const compatCheck = ctx => Promise.resolve(ctx.isEnterprise());

    return compatibilityCheckableComponent(
        WrappedComponent, 
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

const csvMetricsComponent = (WrappedComponent,  heading, halinCard=true) => {
    const failMsg = <div>
        This feature is only available for databases
        that have CSV metrics enabled.   See the
        <a href='https://neo4j.com/docs/operations-manual/current/monitoring/metrics/expose/#metrics-csv'>
        operations manual section on exposing metrics</a>
        to configure this for your database.
    </div>;

    // eslint-disable-next-line no-unused-vars
    const compatCheck = ctx => Promise.resolve(this.props.node && this.props.node.csvMetricsEnabled());

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

const clusterOnlyComponent = (WrappedComponent, heading, halinCard=true) => {
    const failMsg = 'Only available for Neo4j Clusters';
    const compatCheck = ctx => Promise.resolve(ctx.members() && ctx.members().length > 1);

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

const adminOnlyComponent = (WrappedComponent, heading, halinCard=true) => {
    const failMsg = "Only users with role 'admin' may use this function";

    // In Neo4j community, there are no roles, effectively
    // everyone is an admin.  So while under community you
    // won't have role='admin', you will have permissions
    // to do stuff.  Weird.
    const compatCheck = ctx => Promise.resolve(!ctx.isEnterprise() || ctx.getCurrentUser().roles.indexOf('admin') > -1);

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

/**
 * In Neo4j 4.2, breaking changes were made to JMX which included disabling JMX metrics by default.
 * This component catches that case
 */
const neo4j42JMXComponent = (WrappedComponent, heading, halinCard=true) => {
    const failMsg = "As of Neo4j 4.2, you must set metrics.jmx.enabled=true in your configuration in order to use this function";

    const compatCheck = ctx => {
        const version = ctx.getVersion();        
        if(version.major === 4 && version.minor >= 2) { return Promise.resolve(false); }
        return Promise.resolve(true);
    }

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

const dbStatsOnlyComponent = (WrappedComponent, heading, halinCard=true) => {
    const failMsg = 'Only available in versions of Neo4j which support db.stats (Neo4j 3.5.2 and above)';
    const compatCheck = ctx => Promise.resolve(ctx.supportsDBStats());

    return compatibilityCheckableComponent(
        WrappedComponent,
        compatCheck,
        () => missingFeatureMessage(heading, failMsg, halinCard)
    );
};

/**
 * Used as a wapper to exhibit content panes around *Pane components.
 * @param {Component} WrappedComponent 
 */
const contentPaneComponent = (WrappedComponent) => {
    return props => 
        <div className='ContentPaneComponent'>
            <WrappedComponent {...props} />
        </div>;
};

export default {
    contentPaneComponent,
    adminOnlyComponent,
    enterpriseOnlyComponent,
    neo4j42JMXComponent,
    clusterOnlyComponent,
    apocOnlyComponent,
    csvMetricsComponent,
    compatibilityCheckableComponent,
    dbStatsOnlyComponent,
};