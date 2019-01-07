import React, { Component } from 'react';
import { Message } from 'semantic-ui-react';
import neo4jErrors from '../driver/errors';

export default class Troubleshooting extends Component {
    issuesAndResolutions = [
        {
            detector: neo4jErrors.unauthorized,
            suggestions: ['Double check your username and password and try again'],
        },
        {
            detector: neo4jErrors.failedToEstablishConnection,
            suggestions: [`This error can mean that your database instance is under heavy load or is
            not currently responsive`],
        },
        {
            detector: neo4jErrors.browserSecurityConstraints,
            suggestions: [
                `This error can mean that you have untrusted SSL certificates on your server.
                Either install trusted certificates, or try again without encryption.`,
                'This error can also mean that you have provided an incorrect DNS name or address for the database',
                'If you are using Neo4j Desktop and running on your local machine, de-select encryption.',            
                'Double check your host and try again'
            ],
        },
        {
            detector: neo4jErrors.noActiveDatabase,
            suggestions: [
                'Check to make sure you have activated a database in Neo4j Desktop before launching Halin',
            ],
        },
        {
            detector: err => `${err}`.match(/./),
            suggestions: [`
            Unfortunately, no troubleshooting is available for this particular error. 
            Consider checking the Neo4j community site for more information.`],
        },
    ];

    renderList(suggestions) {
        if (!suggestions) { return ''; }
        return suggestions.map((someText, idx) => <p key={idx}>{someText}</p>);
    }

    render() {
        let suggestions = ['No suggestions available'];

        for (let i=0; i<this.issuesAndResolutions.length; i++) {
            const option = this.issuesAndResolutions[i];

            if (option.detector(this.props.error)) {
                suggestions = option.suggestions;
                break;
            }
        }

        return (
            <Message>
                <Message.Header>Troubleshooting { suggestions ? 'this connection error' : 'Connection Errors' }</Message.Header>

                { this.renderList(suggestions) }

                <p>For more information, please see&nbsp;
                    <a target='_new' href='https://community.neo4j.com/t/troubleshooting-connection-issues-in-neo4j-browser-and-cypher-shell/129'>
                        Troubleshooting Connection Issues with Neo4j Tools
                    </a>
                </p>
            </Message>
        );
    }
}