import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import _ from 'lodash';
import Explainer from '../Explainer';

class UsedMemory extends Component {
    state = {
        key: uuid.v4(),
        width: 400,
        displayProperty: 'physUsed',
    };

    onUpdate = (childQueryState) => {
        // console.log('child query state',childQueryState);
    };

    augmentData = (node) => (data) => {
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

    help() {
        return (
            <div className='UsedMemoryHelp'>
                <p>This displays total physical memory / RAM available to the machine that Neo4j runs on.</p>
                <p>This is <strong>not</strong> limited to what Neo4j uses, but covers all processes running on that machine</p>
                <p><a href="https://neo4j.com/docs/java-reference/current/jmx-metrics/">
                Read the docs on JMX monitoring of the operating system</a></p>
            </div>
        );
    }

    render() {
        return (
            <div className="UsedMemory">
                <h3>Used Physical Memory <Explainer content={this.help()}/></h3>
                
                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </div>
        )
    }
}

export default UsedMemory;
