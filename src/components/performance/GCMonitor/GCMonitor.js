import React, { Component } from 'react';
import CypherDataTable from '../../data/CypherDataTable/CypherDataTable';
import queryLibrary from '../../../api/data/queries/query-library';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

/**
 * @deprecated by the GC monitor on the overview dashboard, and by the fact
 * that this component is ugly and hard to use.  ;)
 */
class GCMonitor extends Component {
    query = queryLibrary.JMX_GARBAGE_COLLECTOR.query;
    displayColumns = queryLibrary.JMX_GARBAGE_COLLECTOR.columns;

    render() {
        return (
            <div className="GCMonitor">
                <h3>Last Garbage Collection <Explainer knowledgebase='GarbageCollection'/></h3>

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
