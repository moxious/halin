import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../api/data/queries/query-library';
import datautil from '../../api/data/util';
import _ from 'lodash';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';

class UsedMemory extends Component {
    state = {
        key: uuid.v4(),
        width: 400,
        displayProperty: 'physUsed',
        maxMemory: 0,
    };

    // onUpdate = (childQueryState) => {
    //     // console.log('child query state',childQueryState);
    // };

    augmentData = (/* node */) => (data) => {
        const physUsed = data.physTotal - data.physFree;
        return { physUsed };
    };

    componentDidMount() {
        this.setState({
            maxMemory: window.halinContext.getWriteMember().dbms.physicalMemory || 0,
        });
    }

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const feed = halin.getDataFeed(_.merge({ node }, queryLibrary.OS_MEMORY_STATS));

        feed.addAliases({ physUsed: ClusterTimeseries.keyFor(addr, this.state.displayProperty) });
        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    render() {
        const header = 'Physical Memory (max=' + datautil.humanDataSize(this.state.maxMemory, true) + ')';

        return (
            <HalinCard header={header} knowledgebase="Memory" owner={this}>
                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    max={this.state.maxMemory}
                    // onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </HalinCard>
        )
    }
}

export default UsedMemory;
