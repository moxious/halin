import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class TransactionMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Transactions") 
            YIELD attributes WITH attributes as a 
            RETURN 
                a.NumberOfRolledBackTransactions.value as rolledBack, 
                a.NumberOfOpenTransactions.value as open, 
                a.LastCommittedTxId.value as lastCommittedId, 
                a.NumberOfOpenedTransactions.value as opened, 
                a.PeakNumberOfConcurrentTransactions.value as concurrent, 
                a.NumberOfCommittedTransactions.value as committed
        `,

        displayColumns: [
            { Header: 'Rolled Back', accessor: 'rolledBack' },
            { Header: 'Open', accessor: 'open' },
        ],
        legendOnlyColumns: [
            { Header: 'Peak Concurrent', accessor: 'concurrent' },
            { Header: 'Opened', accessor: 'opened' },
            { Header: 'Committed', accessor: 'committed' },
            { Header: 'Last Committed', accessor: 'lastCommittedId' },
        ],
    };

    onUpdate = (childQueryState) => {
        // console.log('child query state',childQueryState);
    };

    render() {
        return (
            <div className="TransactionMonitor">
                <CypherTimeseries key={this.state.key}
                    driver={this.props.driver}
                    node={this.props.node}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    onUpdate={this.onUpdate}
                    startingEnabled={[this.state.displayColumns[1]]}
                    displayColumns={this.state.displayColumns}
                    legendOnlyColumns={this.state.legendOnlyColumns}
                />
            </div>
        )
    }
}

export default TransactionMonitor;
