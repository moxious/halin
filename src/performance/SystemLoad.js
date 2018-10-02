import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class SystemLoad extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.OS_LOAD_STATS.query, 
        displayColumns: queryLibrary.OS_LOAD_STATS.columns,
    };

    render() {
        return (
            <div className="SystemLoad">
                <CypherTimeseries key={this.state.key}
                    driver={this.props.driver}
                    node={this.props.node}
                    query={this.state.query}
                    width={this.state.width}
                    rate={this.state.rate}
                    displayColumns={this.state.displayColumns}
                />
            </div>
        )
    }
}

export default SystemLoad;
