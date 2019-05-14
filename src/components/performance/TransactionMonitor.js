import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';
import queryLibrary from '../../api/data/queries/query-library';
import hoc from '../higherOrderComponents';
import Explainer from '../Explainer';

class TransactionMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: queryLibrary.JMX_TRANSACTIONS.query,
        displayColumns: queryLibrary.JMX_TRANSACTIONS.columns,
        legendOnlyColumns: queryLibrary.JMX_TRANSACTIONS.legendOnlyColumns,
    };

    onUpdate = (/* childQueryState */) => {
        // console.log('child query state',childQueryState);
    };

    render() {
        const explainer = <Explainer knowledgebase='Transactions' />;
        return (
            <div className="TransactionMonitor">
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
            </div>
        )
    }
}

export default hoc.enterpriseOnlyComponent(TransactionMonitor, 'Transaction Monitor');
