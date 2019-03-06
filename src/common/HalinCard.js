import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';
import './HalinCard.css';
import Explainer from '../Explainer';

export default class HalinCard extends Component {
    render() {
        return (
            <Card fluid className='HalinCard'>
                <Card.Header><h3>{this.props.header}</h3></Card.Header>
                { this.props.children }
                { this.props.owner && this.props.owner.help ?
                  <Card.Content extra>
                    <Explainer content={this.props.owner.help()} />
                  </Card.Content> : 
                  ''
                }
            </Card>
        );
    }
};
