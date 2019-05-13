import React, { Component } from 'react';
import fields from '../data/fields';
import CypherDataTable from '../data/CypherDataTable';
import queryLibrary from '../data/queries/query-library';
import Explainer from '../Explainer';

class StoreFiles extends Component {
    state = {
        rate: (1000 * 60), // Once per minute
        query: queryLibrary.JMX_STORE_SIZES.query,
        displayColumns: [
            { Header: 'Total', accessor: 'total', Cell: fields.dataSizeField },
            { Header: 'Nodes', accessor: 'nodeStore', Cell: fields.dataSizeField },
            { Header: 'Relationships', accessor: 'relStore', Cell: fields.dataSizeField },
            { Header: 'Properties', accessor: 'propStore', Cell: fields.dataSizeField },

            { Header: 'TX Logs', accessor: 'txLogs', Cell: fields.dataSizeField, show: false },
            { Header: 'Strings', accessor: 'stringStore', Cell: fields.dataSizeField, show: false },
            { Header: 'Arrays', accessor: 'arrayStore', Cell: fields.dataSizeField, show: false },
            { Header: 'Other', accessor: 'otherStore', Cell: fields.dataSizeField, show: true },
        ],
    };

    render() {
        return (
            <div className='StoreFiles'>
                <h3>Store File Sizes <Explainer knowledgebase='StoreFiles'/></h3>
                <CypherDataTable
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