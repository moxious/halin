import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';
import queryLibrary from '../data/queries/query-library';
import HalinCard from '../common/HalinCard';

class GCMonitor extends Component {
    query = queryLibrary.JMX_GARBAGE_COLLECTOR.query;
    displayColumns = queryLibrary.JMX_GARBAGE_COLLECTOR.columns;

    render() {
        return (
            <HalinCard header='Last Garbage Collection'>
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
            </HalinCard>
        )
    }
}

export default GCMonitor;
