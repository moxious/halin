import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../api/data/queries/query-library';
import _ from 'lodash';
import Explainer from '../ui/scaffold/Explainer/Explainer';

class UsedMemory extends Component {
    state = {
        key: uuid.v4(),
        width: 400,
        displayProperty: 'physUsed',
    };

    // onUpdate = (childQueryState) => {
    //     // console.log('child query state',childQueryState);
    // };

    augmentData = (/* node */) => (data) => {
        const physUsed = data.physTotal - data.physFree;
        return { physUsed };
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const feed = halin.getDataFeed(_.merge({ node }, queryLibrary.OS_MEMORY_STATS));

        feed.addAliases({ physUsed: ClusterTimeseries.keyFor(addr, this.state.displayProperty) });
        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    render() {
        return (
            <div className="UsedMemory">
                <h3>Used Physical Memory <Explainer knowledgebase='UsedMemory' /></h3>
                
                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    // onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </div>
        )
    }
}

export default UsedMemory;
