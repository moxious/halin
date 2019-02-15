import React, { Component } from 'react';
import { Popup, Icon } from 'semantic-ui-react'

export default class Explainer extends Component {
    render() {
        return (
            <Popup trigger={
                <Icon name={(this.props.icon || 'info') + ' circle'} color='green'/>
            } 
            content={this.props.content} />
        );
    }
}