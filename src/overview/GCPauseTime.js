import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import _ from 'lodash';
import Explainer from '../Explainer';

class GCPauseTime extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_GARBAGE_COLLECTOR.query,
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;
        const feed = halin.getDataFeed(_.merge({ node }, queryLibrary.JMX_GARBAGE_COLLECTOR));
        return feed;
    };

    help() {
        return (
            <div className="GCPauseTimeHelp">
                <p>To gain good performance, we want to make sure the JVM is not spending too much time performing garbage collection. The goal is to have a large enough heap to make sure that heavy/peak load will not result in so called GC-trashing. Performance can drop as much as two orders of magnitude when GC-trashing happens. Having too large heap may also hurt performance so you may have to try some different heap sizes.</p>

                <p><a href="https://neo4j.com/docs/operations-manual/current/performance/gc-tuning/">Read more about how to tune the garbage collector</a></p>
            </div>
        );
    }

    render() {
        return (
            <div className="GCPauseTime">
                <h3>Last GC Pause Time <Explainer content={this.help()}/></h3>
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    displayProperty='duration'
                />
            </div>
        )
    }
}

export default GCPauseTime;
