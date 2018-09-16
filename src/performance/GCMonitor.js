import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';

class GCMonitor extends Component {
    query = `
        CALL dbms.queryJmx('java.lang:name=G1 Young Generation,type=GarbageCollector') 
        YIELD name, attributes 
        WHERE name =~ '(?i).*garbage.*' 
        WITH attributes.LastGcInfo.value.properties as lastGC 
        
        RETURN 
            lastGC.startTime as startTime,
            lastGC.duration as duration,
            lastGC.GcThreadCount as threadCount
        LIMIT 1;
    `;

    displayColumns = [
        { Header: 'Duration', accessor: 'duration' },
        { Header: 'Thread Count', accessor: 'threadCount' },
    ];

    render() {
        return (
            <div className="GCMonitor">
                <h3>Last Garbage Collection</h3>

                <CypherDataTable 
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
