import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import queryLibrary from '../data/query-library';

class TransactionsOpen extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: queryLibrary.JMX_TRANSACTIONS.query,
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
