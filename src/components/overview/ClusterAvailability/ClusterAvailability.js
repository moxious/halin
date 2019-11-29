import React, { Component } from 'react';
import { Progress } from 'semantic-ui-react';
import _ from 'lodash';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import UtilizationFeed from '../../../api/data/feeds/UtilizationFeed';

export default class Dummy extends Component {
    state = {
        feed: null,
        readAvailability: 0,
        writeAvailability: 0,
    };

    componentWillMount() {
        if (!this.state.feed) {
            const feed = new UtilizationFeed(window.halinContext);
            feed.addListener(() => this.onUpdate());
            this.setState({ feed });
        }
    }

    getReadAvailability() {
        const v = _.get(this.state.feed.getCalculatedState(), 'read.availability') || 0;
        return Number(v * 100).toFixed(0);
    }

    getWriteAvailability() {
        const v =_.get(this.state.feed.getCalculatedState(), 'write.availability') || 0;
        return Number(v * 100).toFixed(0);
    }

    onUpdate() {
        if (!this.state.feed) { return null; }
        const readAvailability = this.getReadAvailability();
        const writeAvailability = this.getWriteAvailability();


        this.setState({ 
            readAvailability,
            writeAvailability,
        });
    }

    render() {
        return (
            <HalinCard header='Cluster Availability' className='ClusterAvailability'>
                <Progress percent={this.state.readAvailability} progress>
                    Read Availability
                </Progress>

                <Progress percent={this.state.writeAvailability} progress>
                    Write Availability
            </Progress>
            </HalinCard>
        );
    }
}
