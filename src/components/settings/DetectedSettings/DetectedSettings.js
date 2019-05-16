import React, { Component } from 'react';
import { List, Icon } from 'semantic-ui-react'
import './DetectedSettings.css';

export default class DetectedSettings extends Component {
    lineItem(value, name) {
        if (value) {
            return <span><Icon name='check' color='green'/> { name }</span>
        } else {
            return <span><Icon name='delete' color='red'/> { name }</span>
        }
    }

    item(text, iconName) {
        return <span><Icon name={iconName} color='green'/> {text}</span>
    }

    render() {
        const ctx = window.halinContext;

        return (
            <div className='DetectedSettings'>
                <List>
                    <List.Item style={{ fontFamily: 'monospace' }}>
                        { this.item(ctx.getBaseURI(), 'home') }
                    </List.Item>
                    <List.Item>
                        { this.item(ctx.getCurrentUser().username, 'user circle') }
                    </List.Item>
                    <List.Item>
                        { this.item((ctx.getCurrentUser().roles || []).join(', '), 'lock') }
                    </List.Item>
                    
                    { ctx.isCommunity() ? 
                        <List.Item>{ this.lineItem(true, 'Community') }</List.Item>
                        : 
                        <List.Item>{ this.lineItem(true, 'Enterprise') }</List.Item>
                    }
                    <List.Item>{ this.lineItem(ctx.supportsAuth(), 'Authorization') }</List.Item>
                    
                    <List.Item>{ this.lineItem(ctx.supportsNativeAuth(), 'Native Auth') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsSystemGraph(), 'System Graph') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsAPOC(), 'APOC') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsLogStreaming(), 'File Streaming') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsDBStats(), 'DB Stats') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsMetrics(), 'Metrics') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.isCluster(), 'Clustered') }</List.Item>                    
                </List>
            </div>
        );
    }
}