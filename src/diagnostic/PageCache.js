import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';
import queryLibrary from '../data/queries/query-library';
import hoc from '../higherOrderComponents';
import HalinCard from '../common/HalinCard';

class PageCache extends Component {
    state = {
        rate: 2000,
        query: queryLibrary.JMX_PAGE_CACHE.query,
        displayColumns: queryLibrary.JMX_PAGE_CACHE.columns,
    };

    render() {
        return (
            <HalinCard header='Page Cache Statistics'>
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
            </HalinCard>
        );
    }
}

export default hoc.enterpriseOnlyComponent(PageCache, 'Page Cache Statistics');