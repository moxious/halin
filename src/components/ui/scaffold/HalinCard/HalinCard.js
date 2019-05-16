import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';
import './HalinCard.css';
import Explainer from '../Explainer/Explainer';

export default class HalinCard extends Component {
    header() {
        if (this.props.header && this.props.knowledgebase) {
            return (
                <Card.Header>
                    <h3>
                        {this.props.header} 
                        <Explainer knowledgebase={this.props.knowledgebase} />
                    </h3>
                </Card.Header>
            );
        }

        return '';
    }

    render() {
        return (
            <Card fluid className='HalinCard'>
                { this.header() } 
                
                <div className='HalinCardContent'>
                    { this.props.children }
                </div>
            </Card>
        );
    }
};