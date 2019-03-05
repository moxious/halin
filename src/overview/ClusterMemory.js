import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import Explainer from '../Explainer';
import { Card } from 'semantic-ui-react';

class ClusterMemory extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_MEMORY_STATS.query,
    };

    help() {
        return (
            <div className='ClusterMemoryHelp'>
                <p>The heap space is used for query execution, transaction state, management of the graph etc. The size needed for the heap is very dependent on the nature of the usage of Neo4j. For example, long-running queries, or very complicated queries, are likely to require a larger heap than simpler queries.</p>
                <p>Generally speaking, in order to aid performance, we want to configure a large enough heap to sustain concurrent operations.</p>
                <p>In case of performance issues we may have to tune our queries, and monitor their memory usage, in order to determine whether the heap needs to be increased.</p>
                <p>The heap memory size is determined by the parameters dbms.memory.heap.initial_size and dbms.memory.heap.max_size. It is recommended to set these two parameters to the same value. This will help avoid unwanted full garbage collection pauses.</p>
                <p><a href="https://neo4j.com/docs/operations-manual/3.5/performance/memory-configuration/">
                    Read more about memory configuration and performance.
                </a></p>
            </div>
        )
    }

    render() {
        return (
            <Card fluid className="ClusterMemory">
                <Card.Content>
                    <Card.Header>
                        Heap Size                         
                    </Card.Header>

                    <ClusterTimeseries key={this.state.key}
                        query={this.state.query} 
                        width={this.state.width}
                        rate={this.state.rate}
                        displayProperty='heapUsed'
                    />
                </Card.Content>
                <Card.Content extra>
                    <Explainer position='bottom right' content={this.help()}/>
                </Card.Content>
            </Card>
        );
    }
}

export default ClusterMemory;
