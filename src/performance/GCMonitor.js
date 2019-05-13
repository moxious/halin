import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';
import queryLibrary from '../data/queries/query-library';
import Explainer from '../Explainer';

class GCMonitor extends Component {
    query = queryLibrary.JMX_GARBAGE_COLLECTOR.query;
    displayColumns = queryLibrary.JMX_GARBAGE_COLLECTOR.columns;

    help() {
        return (
            <div className='GCMonitorHelp'>
                <p>Slow garbage collection is an indication of performance problems.</p>
                <p>For best performance,
                   you want to make sure the JVM is not spending too much time 
                   performing garbage collection. The goal is to have a large 
                   enough heap to make sure that heavy/peak load will not result 
                   in so called GC-trashing. Performance can drop as much as two orders 
                   of magnitude when GC-trashing happens. Having too large heap may 
                   also hurt performance so you may have to try some different 
                   heap sizes.</p>
                <p>For more information, see the Neo4j documentation on 
                    <a href="https://neo4j.com/docs/operations-manual/current/performance/gc-tuning/">
                    tuning the garbage collector</a></p>
            </div>
        )
    }

    render() {
        return (
            <div className="GCMonitor">
                <h3>Last Garbage Collection <Explainer content={this.help()}/></h3>

                <CypherDataTable 
                    node={this.props.node}
                    query={this.query} 
                    rate={1000}
                    filterable={false}
                    sortable={false}
                    showPagination={false}
                    defaultPageSize={1}
                    displayColumns={this.displayColumns}
                />
            </div>
        )
    }
}

export default GCMonitor;
