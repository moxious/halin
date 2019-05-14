import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';
import queryLibrary from '../../api/data/queries/query-library';
import Explainer from '../Explainer';

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
