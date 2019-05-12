import React from 'react';
import { Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import _ from 'lodash';

const message = (header, body) => ({ header, body });

/**
 * This module makes it easier to format status messages across components.
 * Components are expected to have an "error" object in their state if something
 * is wrong, and a "message" object if the operation was successful.
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


    toastify: (component, options) => {
        const alwaysOptions = _.merge({
            position: 'top-center',
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,       
        }, options);

        const errorOptions = {
            autoClose: false,
        };

        const successOptions = {
            autoClose: true,
        };

        if (component.state.error) {
            const message = '☠️ Error ' + component.state.error.body;
            toast.error(message, _.merge(alwaysOptions, errorOptions, options));
        } else if(component.state.message) {
            const message = '👍 Success ' + component.state.message.body;
            toast.success(message, _.merge(alwaysOptions, successOptions, options));
        }

        return null;
    },

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
                    <p>{component.state.message.body}</p>
                </Message>
        }

        return message;
    }
};