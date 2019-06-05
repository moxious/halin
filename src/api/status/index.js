import React from 'react';
import { Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sentry from '../sentry/index';
import _ from 'lodash';

const message = (header, body) => ({ header, body });

const toastContent = messageObject => 
    <div className='HalinToast'>
        <h4>{messageObject.header}</h4>
        <div>{messageObject.body}</div>
    </div>;

/**
 * This module makes it easier to format status messages across components.
 * Components are expected to have an "error" object in their state if something
 * is wrong, and a "message" object if the operation was successful.
 * 
 * The content of those objects is a "message" object in the function above, which
 * has a "header" and "body" component.
 */
export default {
    message,

    fromClusterOp: (action, opResult) => {
        // In an op result there can be many errors.
        const errors = opResult.results.filter(i => i.err);

        const errStrs = errors.map(error =>
            `On node ${error.node.getBoltAddress()}: ${error.err}`)
            .join(', ');

        if (opResult.success) {
            return message('Success', action);
        } else {
            return message(`Error: ${action}`, errStrs);
        }
    },

    toastContent,

    toastify: (component, overrideOptions) => {
        if (!_.get(component, 'state.error') && !_.get(component, 'state.message')) {
            sentry.warn('Toastify called on a component with nothing to say');
            return null;
        }

        const alwaysOptions = _.merge({
            position: 'top-center',
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,       
        });

        const errorOptions = {
            autoClose: false,
        };

        const successOptions = {
            autoClose: true,
        };

        const toastBody = (component.state.error ? 
            toastContent(component.state.error) : 
            toastContent(component.state.message));
        const thisToastOptions = component.state.error ? errorOptions : successOptions;

        const finalOptions = _.merge(alwaysOptions, thisToastOptions, overrideOptions);

        if (component.state.error) {
            return toast.error(toastBody, finalOptions);
        } else {
            return toast.success(toastBody, finalOptions);
        }
    },

    /*
     * This is used for block status messages that are main elements on screen, not 
     * ephemeral notifications like toast.  Example is when you try to connnect to a
     * database and fail
     */
    formatStatusMessage: (component) => {
        let message = '';

        if (component.state.error) {
            message = 
                <Message negative>
                    <Message.Header>{component.state.error.header || 'Error'}</Message.Header>
                    <p>{component.state.error.body || `${component.state.error}`}</p>
                </Message>
        } else if(component.state.message) {
            message = 
                <Message success>
                    <Message.Header>{component.state.message.header || 'Success'}</Message.Header>
                    {component.state.message.body}
                </Message>
        }

        return message;
    }
};