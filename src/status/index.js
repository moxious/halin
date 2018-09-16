import React from 'react';
import { Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

export default {
    message: (header, body) => ({ header, body }),

    formatStatusMessage: (component) => {
        let message = '';

        if (component.state.error) {
            message = 
                <Message negative>
                    <Message.Header>{component.state.error.header || 'Error'}</Message.Header>
                    <p>{component.state.error.body}</p>
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