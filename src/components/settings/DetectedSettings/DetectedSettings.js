import React, { PureComponent } from 'react';
import { List, Icon, Grid } from 'semantic-ui-react'
import './DetectedSettings.css';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

export default class DetectedSettings extends PureComponent {
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
        
        let roles = ctx.getCurrentUser().roles;
        if (roles.length === 0) {
            roles = ['(no roles)'];
        }

        const items = [
            this.item(ctx.getBaseURI(), 'home'),
            this.item(ctx.getCurrentUser().username, 'user circle'),
            this.item(roles.join(', '), 'lock'),
            ctx.isCommunity() ? this.lineItem(true, 'Community') : this.lineItem(true, 'Enterprise'),
            this.lineItem(ctx.supportsAuth(), 'Authorization'),
            this.lineItem(ctx.supportsNativeAuth(), 'Native Auth'),
            this.lineItem(ctx.supportsMultiDatabase(), 'Multi-Database'),
            this.lineItem(ctx.supportsSystemGraph(), 'System Graph'),
            this.lineItem(ctx.supportsAPOC(), 'APOC'),
            this.lineItem(ctx.supportsLogStreaming(), 'File Streaming'),
            this.lineItem(ctx.supportsDBStats(), 'DB Stats'),
            this.lineItem(ctx.supportsMetrics(), 'Metrics'),
            this.lineItem(ctx.isCluster(), 'Clustered'),
            this.lineItem(ctx.isNeo4jAura(), 'Neo4j Aura'),
        ];

        const listify = someStuff =>
            <List style={{textAlign: 'left', wordBreak: 'break-all' }}>
                { someStuff.map((item, key) => <List.Item key={key}>{item}</List.Item>) }
            </List>;

        return (
            <HalinCard header='Detected Settings' className='DetectedSettings'>
                <Grid>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            { listify(items.slice(0, Math.floor(items.length / 2))) }
                        </Grid.Column>
                        <Grid.Column>
                            { listify(items.slice(Math.floor(items.length / 2), items.length)) }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </HalinCard>
        );
    }
}