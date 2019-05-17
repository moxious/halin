import React, { Component } from 'react';
import CypherTimeseries from '../../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../../api/data/queries/query-library';

/* @deprecated by DiskUtilizationPieChart */
class DiskUsage extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        const q = queryLibrary.JMX_STORE_SIZES;

        return (
            <div className="DiskUsage">
                <CypherTimeseries key={this.state.key}
                    node={this.props.node}
                    query={q.query}
                    rate={q.rate}
                    displayColumns={q.columns}
                    startingEnabled={[
                        q.columns[0]
                    ]}
                />
            </div>
        )
    }
}

export default DiskUsage;