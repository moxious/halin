import React, { Component } from 'react';
import CypherTimeseries from '../../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../../api/data/queries/query-library';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

class SystemLoad extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        query: queryLibrary.OS_LOAD_STATS.query, 
        displayColumns: queryLibrary.OS_LOAD_STATS.columns,
    };

    render() {
        const explainer = <Explainer knowledgebase='SystemLoad' />;

        return (
            <HalinCard owner={this}>
                <CypherTimeseries key={this.state.key}
                    heading="Load"
                    explainer={explainer}
                    member={this.props.member}
                    query={this.state.query}
                    rate={this.state.rate}
                    displayColumns={this.state.displayColumns}
                />
            </HalinCard>
        )
    }
}

export default SystemLoad;
