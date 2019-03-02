import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';
import queryLibrary from '../data/queries/query-library';
import 'react-table/react-table.css';

class ActiveTransactions extends Component {
    query = 'call dbms.listTransactions()';
    state = {
        query: queryLibrary.LIST_TRANSACTIONS.query,
        columns: queryLibrary.LIST_TRANSACTIONS.columns,
        rate: 1000,
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    render() {
        return (
            <div className="ActiveTransactions">
                <h2>Active Transactions</h2> 
                <CypherDataTable
                    node={this.props.node}
                    query={this.state.query}
                    allowColumnSelect={true}
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.columns}
                    rate={this.rate}
                />
            </div>
        );
    }
}

export default ActiveTransactions;