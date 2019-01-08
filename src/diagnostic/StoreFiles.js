import React, { Component } from 'react';
import fields from '../data/fields';
import CypherDataTable from '../data/CypherDataTable';

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
            { Header: 'Total', accessor: 'total', Cell: fields.dataSizeField },
            { Header: 'Nodes', accessor: 'nodeStore', Cell: fields.dataSizeField },
            { Header: 'Relationships', accessor: 'relStore', Cell: fields.dataSizeField },
            { Header: 'Properties', accessor: 'propStore', Cell: fields.dataSizeField },

            { Header: 'Logical Log', accessor: 'logicalLog', Cell: fields.dataSizeField, show: false },
            { Header: 'Strings', accessor: 'stringStore', Cell: fields.dataSizeField, show: false },
            { Header: 'Arrays', accessor: 'arrayStore', Cell: fields.dataSizeField, show: false },
        ],
    };

    render() {
        return (
            <div className='StoreFiles'>
                <h3>Store File Sizes</h3>
                <CypherDataTable
                    driver={this.props.driver}
                    node={this.props.node}
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