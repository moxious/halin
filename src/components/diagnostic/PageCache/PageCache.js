import React, { Component } from 'react';
import CypherDataTable from '../../data/CypherDataTable/CypherDataTable';
import queryLibrary from '../../../api/data/queries/query-library';
import hoc from '../../higherOrderComponents';

/**
 * @deprecated - this method is not supported by Neo4j 4.0, and the table layout is less than 
 * ideal.
 */
class PageCache extends Component {
    state = {
        rate: 2000,
        query: queryLibrary.JMX_PAGE_CACHE.query,
        displayColumns: queryLibrary.JMX_PAGE_CACHE.columns,
    };

    render() {
        return (
            <div className='PageCache'>
                <h3>Page Cache Statistics</h3>
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

export default hoc.enterpriseOnlyComponent(PageCache, 'Page Cache Statistics');