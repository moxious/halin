import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import HalinCard from '../common/HalinCard';
import Explainer from '../Explainer';

class SystemLoad extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.OS_LOAD_STATS.query, 
        displayColumns: queryLibrary.OS_LOAD_STATS.columns,
    };

    help() {
        return (
            <div className='SystemLoadHelp'>
                <p>The system load is a measure of the amount of computational work that a computer system performs.</p>
                <p>System load represents overall load, while process load shows how much load is caused by
                    the Neo4j process itself.
                </p>

                <p><a href="https://neo4j.com/docs/operations-manual/current/performance/">Read more about Neo4j performance tuning</a></p>
            </div>
        );
    }

    render() {
        const explainer = <Explainer content={this.help()}/>;

        return (
            <HalinCard header='System Load'>
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
