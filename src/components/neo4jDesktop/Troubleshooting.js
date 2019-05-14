import React, { Component } from 'react';
import { Message } from 'semantic-ui-react';
import neo4jErrors from '../../api/driver/errors';
import kb from '../../api/knowledgebase';

export default class Troubleshooting extends Component {
    issuesAndResolutions = [
        {
            detector: neo4jErrors.unauthorized,
            suggestions: kb.Unauthorized,
        },
        {
            detector: neo4jErrors.failedToEstablishConnection,
            suggestions: kb.FailedToEstablishConnection,
        },
        {
            detector: neo4jErrors.browserSecurityConstraints,
            suggestions: kb.BrowserSecurityConstraints,
        },
        {
            detector: neo4jErrors.noActiveDatabase,
            suggestions: kb.NoActiveDatabase,
        },
        {
            detector: err => `${err}`.match(/./),
            suggestions: kb.UnknownError,
        },
    ];

    render() {
        let suggestions = null;

        for (let i=0; i<this.issuesAndResolutions.length; i++) {
            const option = this.issuesAndResolutions[i];

            if (option.detector(this.props.error)) {
                suggestions = option.suggestions;
                break;
            }
        }

        if (!suggestions) {
            suggestions = kb.render(['No suggestions available']);
        }

        return (
            <Message>
                <Message.Header>
                    Troubleshooting { 
                        suggestions ? 'this connection error' : 'Connection Errors' 
                    }
                    </Message.Header>
                { suggestions ? suggestions : '' }
                { kb.links.troubleshootingConnections.render() }
            </Message>
        );
    }
}