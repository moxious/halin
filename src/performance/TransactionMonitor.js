import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/queries/query-library';
import hoc from '../higherOrderComponents';
import Explainer from '../Explainer';
import HalinCard from '../common/HalinCard';

class TransactionMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_TRANSACTIONS.query,
        displayColumns: queryLibrary.JMX_TRANSACTIONS.columns,
        legendOnlyColumns: queryLibrary.JMX_TRANSACTIONS.legendOnlyColumns,
    };

    onUpdate = (childQueryState) => {
        // console.log('child query state',childQueryState);
    };

    help() {
        return (
            <div className='TransactionMonitorHelp'>
                <p>All database operations that access the graph, indexes, or the schema must be performed in a transaction</p>
                <p>Open transactions are the number of active transactions Neo4j is running at any given moment.</p>
                <p>Rolled back transactions are those who have failed, and whose intermediate effects were "rolled back" so that
                    the entire transaction as a package either succeeds or fails.
                </p>
                <p><a href="https://neo4j.com/docs/java-reference/current/transactions/">Read more about Neo4j transaction management</a></p>
            </div>
        );
    }

    render() {
        const explainer = <Explainer content={this.help()}/>;
        return (
            <HalinCard header='Transaction Monitor'>
                <CypherTimeseries key={this.state.key}
                    node={this.props.node}
                    query={this.state.query} 
                    explainer={explainer}
                    width={this.state.width}
                    rate={this.state.rate}
                    onUpdate={this.onUpdate}
                    startingEnabled={[this.state.displayColumns[1]]}
                    displayColumns={this.state.displayColumns}
                    legendOnlyColumns={this.state.legendOnlyColumns}
                />
            </HalinCard>
        )
    }
}

export default hoc.enterpriseOnlyComponent(TransactionMonitor, 'Transaction Monitor');
