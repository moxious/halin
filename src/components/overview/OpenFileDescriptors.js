import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import { Dropdown } from 'semantic-ui-react';
import queryLibrary from '../../api/data/queries/query-library';
import uuid from 'uuid';
import _ from 'lodash';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';

class OpenFileDescriptors extends Component {
    state = {
        key: uuid.v4(),
        width: 400,
        displayProperty: 'fdUsed',
        options: [
            { text: 'Used', value: 'fdUsed' },
            { text: 'Available', value: 'fdOpen' },
            { text: 'Max', value: 'fdMax' },
        ],
    };

    // onUpdate = (childQueryState) => {
    //     // console.log('child query state',childQueryState);
    // };

    // JMX gives us maximum FDs and open FDs, but we want number of used FDs,
    // so we have to augment the data structure because the timeseries doesn't do math
    // for us.
    augmentData = (/* node */) => (data) => {
        const fdUsed = data.fdMax - data.fdOpen;
        return { fdUsed };
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();

        const feed = halin.getDataFeed(_.merge({ node }, queryLibrary.OS_OPEN_FDS));
        feed.addAliases({ 
            fdUsed: ClusterTimeseries.keyFor(addr, 'fdUsed'),
            fdOpen: ClusterTimeseries.keyFor(addr, 'fdOpen'),
            fdMax: ClusterTimeseries.keyFor(addr, 'fdMax'),
        });

        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    onChange = (e, data) => {
        const a = {
            displayProperty: data.value,
        };
        this.setState(a);
    };

    render() {
        return (
            <HalinCard header='File Descriptors' knowledgebase='FileDescriptors' owner={this}>
                <Dropdown style={{paddingBottom: 10}}
                    placeholder='Show:'
                    fluid defaultValue='usageRatio'
                    onChange={this.onChange}
                    selection
                    options={this.state.options}
                />

                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    // onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </HalinCard>
        )
    }
}

export default OpenFileDescriptors;
