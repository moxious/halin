import React, { Component } from "react";
import 'semantic-ui-css/semantic.min.css';
import queryLibrary from '../data/queries/query-library';
import CypherDataTable from '../data/CypherDataTable';
import 'react-table/react-table.css';

class Connections extends Component {
    state = {
        query: queryLibrary.DBMS_LIST_CONNECTIONS.getQuery(),
        columns: queryLibrary.DBMS_LIST_CONNECTIONS.getColumns(),
        rate: 1000,
    };

    render() {
        return (
            <div className="ActiveConnections">
                <h2>Active Connections</h2> 
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

export default Connections;