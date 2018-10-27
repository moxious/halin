import React, { Component } from 'react';
import { Menu, Icon, Popup } from 'semantic-ui-react'

export default class ClusterNodeTabHeader extends Component {
    state = {
        ratio: 1,
        total: 1,
        fresh: 1,
        notFresh: 0,
    };

    sampleFeeds() {
        if (!this.mounted) { return null; } 
        const feeds = window.halinContext.getFeedsFor(this.props.node).map(feed => feed.isFresh());

        const total = feeds.length;
        const fresh = feeds.filter(f => f).length;
        const notFresh = feeds.filter(f => !f).length;

        this.setState({ 
            ratio: fresh/total,
            total,
            fresh,
            notFresh,
        });
    }

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.sampleFeeds(), 500);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    colorFor = (ratio) => {
        if (ratio >= 0.8) { return 'green'; }
        if (ratio >= 0.6) { return 'yellow'; }
        return 'red';
    };

    popupContent = () => {
        return (
            <div className='PopupContent'>
                <p>{`${this.state.fresh} of ${this.state.total} fresh`}</p>

                <p>When most/all feeds are fresh, this indicates responsiveness.  When performance
                degrades, data feeds slow, stop, or error.</p>
            </div>
        );
    };

    render() {
        const node = this.props.node;

        const leader = `${node.role}`.toLowerCase() === 'leader';
        const label = `${node.getLabel()} (${node.role})`;

        return (
            <Menu.Item>
                { leader ? <Icon name='star' color={this.colorFor(this.state.ratio)} /> : '' }

                <Popup
                    key={node.getBoltAddress()}
                    trigger={<Icon name='database' color={this.colorFor(this.state.ratio)} />}
                    header='Data Feeds'
                    content={this.popupContent()}
                />
                 
                {label}
            </Menu.Item>
        );
    }
}