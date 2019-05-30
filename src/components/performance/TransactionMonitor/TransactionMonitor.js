import React, { Component } from 'react';
import CypherTimeseries from '../../timeseries/CypherTimeseries';
import uuid from 'uuid';

import queryLibrary from '../../../api/data/queries/query-library';

import hoc from '../../higherOrderComponents';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

class TransactionMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
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
            <HalinCard owner={this}>
                <CypherTimeseries key={this.state.key}
                    heading="Transaction Monitor"
                    node={this.props.node}
                    query={this.state.query} 
                    explainer={explainer}
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
