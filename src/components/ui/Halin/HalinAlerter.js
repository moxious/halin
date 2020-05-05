import React, { Component } from 'react';
import status from '../../../api/status/index';
import api from '../../../api';
import LRU from 'lru-cache';

/**
 * This component is always an empty DOM element, but exists to monitor and pop up
 * toast when certain events call for it.
 */
const cacheOptions = {
    max: 20,
    maxAge: 1 * 60 * 1000, /* 1 min */
};

export default class HalinAlerter extends Component {
    seen = new LRU(cacheOptions);
    state = {
        message: null,
        error: null,
        pending: false,
        interval: null,
        lastCheck: null,
        listener: event => {
            if (!event.alert) { return false; }

            // LRU cache prevents us from spamming user with the same message when
            // it comes up repeatedly.  Timeout allows it to arise again later.
            if (this.seen.get(event.message)) {
                api.sentry.fine('Alerter: Skipping spam message');
                return null;
            } else {
                this.seen.set(event.message, true);
            }

            const msg = status.message(event.message);
            const component = {};
            
            if (event.error) {
                component.state = { error: msg };
            } else {
                component.state = { message: msg };
            }

            return status.toastify(component);
        },
    };

    componentWillMount() {
        this.props.context.getClusterManager().on('data', this.state.listener);
    }

    componentWillUnmount() {
        this.props.context.getClusterManager().removeListener('data', this.state.listener);
    }

    update() {
        const mgr = this.props.context.getClusterManager();

        // We only want events where the alert flag is set to true, and that haven't already
        // been displayed (which we can know by date stamp)
        const filterFn = event => event.alert && (this.state.lastCheck ? event.date >= this.state.lastCheck : true);

        const events = mgr.getEventLog().filter(filterFn);
        
        console.log('Events not yet processed',events);
        
        events.map(e => status.toastify({
            state: {
                message: status.message(e.message),
            },
        }));

        this.setState({ lastCheck: new Date() });
    }

    render() {
        return <span id='HalinAlerter'/>
    }
}