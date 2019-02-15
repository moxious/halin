import React, { Component } from 'react';
import { Popup, Icon } from 'semantic-ui-react'

export default class Explainer extends Component {
    render() {
        return (
            <Popup on='click' wide='very'
               position={this.props.position || 'bottom'}
               trigger={
                  <Icon name={(this.props.icon || 'info') + ' circle'} color='green'/>
               } 
            content={this.props.content} />
        );
    }
}