import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';
import './HalinCard.css';
import Explainer from '../Explainer/Explainer';

export default class HalinCard extends Component {
    render() {
        return (
            <Card fluid className='HalinCard'>
                <Card.Header>
                    <h3>{this.props.header} <Explainer knowledgebase={this.props.knowledgebase} /></h3>
                </Card.Header>
                { this.props.children }
            </Card>
        );
    }
};