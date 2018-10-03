import React, { Component } from 'react';
import { Accordion, Icon, Label } from 'semantic-ui-react';
import datautil from '../data/util';
import NodeLabel from '../NodeLabel';
import _ from 'lodash';

export default class SettingsPane extends Component {
    state = { activeIndex: 0 };

    handleClick = (e, titleProps) => {
      const { index } = titleProps
      const { activeIndex } = this.state
      const newIndex = activeIndex === index ? -1 : index
  
      this.setState({ activeIndex: newIndex })
    };

    dataFeedStats() {
        const halin = window.halinContext;
        const feedStats = Object.values(halin.dataFeeds).map(feed => feed.stats());

        return _.sortBy(feedStats, ['address', 'label']);
    }

    render() {
        const style = {textAlign:'left'};
        return (
            <div className='SettingsPane'>
                <h2>Halin Settings</h2>

                <Accordion fluid styled exclusive={false}>
                    {
                        this.dataFeedStats().map((stats, idx) =>
                            <div key={idx}>
                                <Accordion.Title 
                                    onClick={this.handleClick}
                                    index={idx} style={style}
                                    active={this.state.activeIndex===idx}
                                >
                                    <NodeLabel node={stats.node} />
                                    <Label>{stats.label}</Label>
                                        <Label>
                                            Best
                                            <Label.Detail>
                                                {datautil.roundToPlaces(stats.bestResponseTime, 2)}ms
                                            </Label.Detail>
                                        </Label>
                                        <Label>
                                            Avg. Response Time
                                            <Label.Detail>
                                                {datautil.roundToPlaces(stats.averageResponseTime, 2)}ms
                                            </Label.Detail>
                                        </Label>
                                        <Label>
                                            Worst
                                            <Label.Detail>
                                                {datautil.roundToPlaces(stats.worstResponseTime, 2)}ms
                                            </Label.Detail>
                                        </Label>
                                </Accordion.Title>
                                <Accordion.Content 
                                    active={this.state.activeIndex===idx}
                                    index={idx}>
                                    <ul style={style}>
                                        <li>Listeners: {stats.listeners}</li>
                                        <li>Augmentation Functions: {stats.augFns}</li>
                                        <li>Aliases: {stats.aliases}</li>
                                        <li>Timings: {stats.timings.map(i => `${i}`).join(', ')}</li>                                        
                                        <li>Packets: {stats.packets}</li>
                                    </ul>

                                    <h5>Query</h5>
                                    <pre style={style}>{stats.query}</pre>
                                </Accordion.Content>
                            </div>)
                    }
                </Accordion>
            </div>
        )
    }
};