import React from 'react';
import { Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

const message = (header, body) => ({ header, body });

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