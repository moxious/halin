import React, { Component } from 'react';
import DataFeedStats from './DataFeedStats';
import ClusterResponseGraph from './ClusterResponseGraph';
import { List, Icon } from 'semantic-ui-react'
import './SettingsPane.css';

const debug = false;

class DetectedSettings extends Component {
    lineItem(value, name) {
        if (value) {
            return <span><Icon name='check' color='green'/> { name }</span>
        } else {
            return <span><Icon name='delete' color='red'/> { name }</span>
        }
    }

    render() {
        const ctx = window.halinContext;

        return (
            <div className='DetectedSettings' style={{ paddingTop: '15px', paddingBottom: '15px' }}>
                <List>
                    <List.Item>{ this.lineItem(ctx.supportsAPOC(), 'Supports APOC') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.isCluster(), 'Clustered Deployment') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.isEnterprise(), 'Enterprise Edition') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.isCommunity(), 'Community Edition') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsAuth(), 'Supports authorization') }</List.Item>
                    <List.Item>{ this.lineItem(ctx.supportsNativeAuth(), 'Native Authorization') }</List.Item>
                    <List.Item>
                        <Icon name='user circle' color='green' />
                        { ctx.getCurrentUser().username } Current User with roles { ctx.getCurrentUser().roles }
                    </List.Item>
                </List>
            </div>
        );
    }
}

export default class SettingsPane extends Component {
    render() {
        // const style = {textAlign:'left'};
        return (
            <div className='SettingsPane'>
                <DetectedSettings/>

                { debug ? <ClusterResponseGraph/> : '' }

                <DataFeedStats />
            </div>
        )
    }
};