import React, { Component } from 'react';
import { Popup, Icon } from 'semantic-ui-react'
import kb from '../../api/knowledgebase';

export default class Explainer extends Component {
    getContent() {
        if (this.props.knowledgebase) {
            return kb[this.props.knowledgebase];
        }

        return this.props.content || 'No further information available';
    }

    render() {        
        return (
            <Popup on='hover' wide='very'
               position={this.props.position || 'bottom left'}
               trigger={
                  <Icon name={(this.props.icon || 'info') + ' circle'} color='green'/>
               } 
            content={this.getContent()} />
        );
    }
}