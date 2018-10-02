import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';

class TransactionsOpen extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: `
            CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Transactions") 
            YIELD attributes WITH attributes as a 
            RETURN 
                a.NumberOfOpenTransactions.value as open
        `,

        displayColumns: [
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
                <h3>Transactions Open</h3>
                
                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    rate={this.state.rate}
                    onUpdate={this.onUpdate}
                    displayProperty='open'
                />
            </div>
        )
    }
}

export default TransactionsOpen;
