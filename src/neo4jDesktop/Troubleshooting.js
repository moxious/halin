import React, { Component } from 'react';
import { Message } from 'semantic-ui-react';

export default class Troubleshooting extends Component {
    issuesAndResolutions = [
        {
            detector: /unauthorized/i, 
            suggestions: ['Double check your username and password and try again'],
        },
        {
            detector: /failed to establish connection in/i,
            suggestions: [`This error may mean that your database instance is under heavy load or is
            not currently responsive`],
        },
        {
            detector: /security constraints in your web browser/i,
            suggestions: [
                `This error often means that you have untrusted SSL certificates on your server.
                Either install trusted certificates, or try again without encryption.`,
                'This error can also mean that you have provided an incorrect DNS name or address for the database',
                'If you are using Neo4j Desktop and running on your local machine, de-select encryption.',            
                'Double check your host and try again'
            ],
        },
        {
            detector: /./,
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
        const str = `${this.props.error}`;
        let suggestions = ['No suggestions available'];

        for (let i=0; i<this.issuesAndResolutions.length; i++) {
            const option = this.issuesAndResolutions[i];

            if (str.match(option.detector)) {
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