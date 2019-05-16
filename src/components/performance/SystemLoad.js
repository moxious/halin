import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../api/data/queries/query-library';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';
import Explainer from '../ui/scaffold/Explainer/Explainer';

class SystemLoad extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.OS_LOAD_STATS.query, 
        displayColumns: queryLibrary.OS_LOAD_STATS.columns,
    };

    render() {
        const explainer = <Explainer knowledgebase='SystemLoad' />;

        return (
            <HalinCard owner={this}>
                <CypherTimeseries key={this.state.key}
                    explainer={explainer}
                    node={this.props.node}
                    query={this.state.query}
                    width={this.state.width}
                    rate={this.state.rate}
                    displayColumns={this.state.displayColumns}
                />
            </HalinCard>
        )
    }
}

export default SystemLoad;
