import React, { Component } from 'react';
import CypherTimeseries from '../../timeseries/CypherTimeseries';
import uuid from 'uuid';

import queryLibrary from '../../../api/data/queries/query-library';

import hoc from '../../higherOrderComponents';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

/**
 * @deprecated this component is now deprecated by 4.0 changes.
 * It is not specific to an individual database's transactions, but to a cluster
 * member, which only made sense in the 3.5 series.
 */
class TransactionMonitor extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        query: queryLibrary.find(window.halinContext, 'transactions').query,
        displayColumns: queryLibrary.find(window.halinContext, 'transactions').columns,
        legendOnlyColumns: queryLibrary.find(window.halinContext, 'transactions').legendOnlyColumns,
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
                    member={this.props.member}
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
