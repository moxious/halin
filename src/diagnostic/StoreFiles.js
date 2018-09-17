import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';

const cdt = CypherDataTable; // alias for shorthand

class StoreFiles extends Component {
    state = {
        rate: (1000 * 60), // Once per minute
        query: `
            CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Store file sizes') 
            YIELD attributes 
            WITH
                attributes.LogicalLogSize.value as logicalLog, 
                attributes.StringStoreSize.value as stringStore, 
                attributes.ArrayStoreSize.value as arrayStore, 
                attributes.RelationshipStoreSize.value as relStore, 
                attributes.PropertyStoreSize.value as propStore, 
                attributes.TotalStoreSize.value as total, 
                attributes.NodeStoreSize.value as nodeStore
            RETURN 
                logicalLog, stringStore, arrayStore, 
                relStore, propStore, total, nodeStore;        
        `,
        displayColumns: [
            { Header: 'Total', accessor: 'total', Cell: cdt.dataSizeField },
            { Header: 'Nodes', accessor: 'nodeStore', Cell: cdt.dataSizeField },
            { Header: 'Relationships', accessor: 'relStore', Cell: cdt.dataSizeField },
            { Header: 'Properties', accessor: 'propStore', Cell: cdt.dataSizeField },

            { Header: 'Logical Log', accessor: 'logicalLog', Cell: cdt.dataSizeField, show: false },
            { Header: 'Strings', accessor: 'stringStore', Cell: cdt.dataSizeField, show: false },
            { Header: 'Arrays', accessor: 'arrayStore', Cell: cdt.dataSizeField, show: false },
        ],
    };

    render() {
        return (
            <div className='StoreFiles'>
                <h3>Store File Sizes</h3>
                <CypherDataTable
                    query={this.state.query}
                    allowColumnSelect={true}
                    displayColumns={this.state.displayColumns}
                    showPagination={false}
                    defaultPageSize={1}
                    sortable={false}
                    filterable={false}
                    rate={this.state.rate}/>
            </div>
        );
    }
}

export default StoreFiles;