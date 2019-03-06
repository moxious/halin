import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import Explainer from '../Explainer';
import HalinCard from '../common/HalinCard';

class MemoryMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_MEMORY_STATS.query,
        displayColumns: queryLibrary.JMX_MEMORY_STATS.columns,
    };

    help() {
        return (
            <div className='MemoryMonitorHelp'>
                <p>Total memory shows the total amount in use.</p>
                <p>Heap – The heap is where your Class instantiations or “Objects” are stored.</p>
                <p>Heap is further divided into two categories; the amount used, and the amount committed,
                    or in other words how much the database has allocated for potential use.</p>
                <p>The JVM has memory other than the heap, referred to as Non-Heap Memory. 
                    It is created at the JVM startup and stores per-class structures such as 
                    runtime constant pool, field and method data, and the code for methods and 
                    constructors, as well as interned Strings. The default maximum size of 
                    non-heap memory is 64 MB. This can be changed using –XX:MaxPermSize VM option.</p>

                <p><a href="https://neo4j.com/developer/kb/understanding-memory-consumption/">Read more about Neo4j memory consumption</a></p>
            </div>
        );
    }

    render() {
        const explainer = <Explainer content={this.help()} />;

        return (
            <HalinCard header='Memory Monitor'>
                <CypherTimeseries key={this.state.key}
                    node={this.props.node}
                    explainer={explainer}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    startingEnabled={[this.state.displayColumns[1]]}
                    displayColumns={this.state.displayColumns}
                />
            </HalinCard>
        )
    }
}

export default MemoryMonitor;
