import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class DBSize extends Component {
    query = 'MATCH (n) RETURN count(n) as totalNodes';

    displayColumns = [
        { Header: 'Total Nodes', accessor: 'totalNodes'}, 
    ];

    render() {
        const key = this.props.key || uuid.v4();

        return (
            <div className="DBSize">
                <h3>Total Node Count</h3>
                <CypherTimeseries key={key}
                    driver={this.props.driver}
                    node={this.props.node}
                    query={this.query} 
                    displayColumns={this.displayColumns}
                    min={0}
                    />
            </div>
        )
    }
}

export default DBSize;
