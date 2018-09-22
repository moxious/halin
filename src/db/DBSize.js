import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class DBSize extends Component {
    state = {
        key: uuid.v4(),
        query: 'MATCH (n) RETURN count(n) as totalNodes',
        displayColumns: [
            { Header: 'Total Nodes', accessor: 'totalNodes'}, 
        ],
    };
    
    render() {
        return (
            <div className="DBSize">
                <h3>Total Node Count</h3>
                <CypherTimeseries key={this.state.key}
                    driver={this.props.driver}
                    node={this.props.node}
                    query={this.state.query} 
                    displayColumns={this.state.displayColumns}
                    min={0}
                    />
            </div>
        )
    }
}

export default DBSize;
