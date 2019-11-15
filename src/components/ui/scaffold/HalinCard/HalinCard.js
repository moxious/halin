import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Card } from 'semantic-ui-react';
import './HalinCard.css';
import Explainer from '../Explainer/Explainer';
import _ from 'lodash';

export default class HalinCard extends PureComponent {
    header() {
        if (this.props.header) {
            return (
                <Card.Header>
                    <h3>
                        {this.props.header} 
                        { this.props.knowledgebase ? <Explainer knowledgebase={this.props.knowledgebase} /> : '' }
                    </h3>
                </Card.Header>
            );
        }

        return '';
    }

    render() {
        const cardprops = _.pick(this.props, ['id']);

        return (
            <Card fluid className='HalinCard' {...cardprops}>
                { this.header() } 
                
                <div className='HalinCardContent'>
                    { this.props.children }
                </div>
            </Card>
        );
    }
}

HalinCard.props = {
    children: PropTypes.node.isRequired,
    knowledgebase: PropTypes.string,
    header: PropTypes.string,
}