import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';

class DBSize extends Component {
    query = 'MATCH (n) RETURN count(n) as totalNodes';

    displayColumns = [
        { Header: 'Total Nodes', accessor: 'totalNodes'}, 
    ];

    render() {
        return (
            <div className="DBSize">
                <h3>Total Node Count</h3>
                <CypherTimeseries 
                    query={this.query} 
                    displayColumns={this.displayColumns}
                    min={0}
                    />
            </div>
        )
    }
}

export default DBSize;