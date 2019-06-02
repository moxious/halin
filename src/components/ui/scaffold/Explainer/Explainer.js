import React, { Component } from 'react';
import { Popup, Icon } from 'semantic-ui-react'
import kb from '../../../../api/knowledgebase';
import sentry from '../../../../api/sentry/';

const iGotNothing = 'No further information available';

export default class Explainer extends Component {
    getMainContent() {
        if (this.props.knowledgebase) {
            if (!kb[this.props.knowledgebase]) {
                sentry.warn('No kb entry for ',this.props.knowledgebase);
            }

            return kb[this.props.knowledgebase] || iGotNothing;
        }

        return this.props.content || iGotNothing;
    }

    getIntroContent() {
        return this.props.intro || null;
    }

    getContent() {
        const intro = this.getIntroContent();
        const mainContent = this.getMainContent();

        return (intro ? 
            <div>
                { intro }
                { mainContent }
            </div> : mainContent);
    }

    render() {        
        return (
            <Popup on='click' wide='very' inverted
               position={this.props.position || 'bottom left'}
               trigger={
                  <Icon name={(this.props.icon || 'info') + ' circle'} color='green'/>
               } 
            content={this.getContent()} />
        );
    }
}