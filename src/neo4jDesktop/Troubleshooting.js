import React, { Component } from 'react';
import { Message } from 'semantic-ui-react';

export default class Troubleshooting extends Component {
    renderList(suggestions) {
        if (!suggestions) { return ''; }
        return suggestions.map((someText, idx) => <p key={idx}>{someText}</p>);
    }

    render() {
        const str = `${this.props.err}`;
        let suggestions = null;

        if (str.indexOf('unauthorized') > -1) {
            suggestions = ['Double check your username and password and try again'];
        } else if(str.indexOf('security constraints in your web browser')) {
            suggestions = [`
                This error often means that you have untrusted SSL certificates on your server.
                Either install trusted certificates, or try again without encryption.`,
                'If you are using Neo4j Desktop and running on your local machine, de-select encryption',
            ];
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