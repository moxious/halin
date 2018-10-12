import React, { Component } from 'react';
import CypherDataTable from '../data/CypherDataTable';
import queryLibrary from '../data/query-library';
import hoc from '../higherOrderComponents';

class PageCache extends Component {
    state = {
        rate: 2000,
        query: queryLibrary.JMX_PAGE_CACHE.query,
        displayColumns: queryLibrary.JMX_PAGE_CACHE.columns,
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className='PageCache'>
                <h3>Page Cache Statistics</h3>
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

export default hoc.enterpriseOnlyComponent(PageCache, 'Page Cache Statistics');