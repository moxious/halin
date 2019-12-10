import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import _ from 'lodash';
import uuid from 'uuid';

import queryLibrary from '../../../api/data/queries/query-library';

import hoc from '../../higherOrderComponents';
import ClusterTimeseries from '../../timeseries/ClusterTimeseries';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

class TransactionsOpen extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        query: queryLibrary.find(window.halinContext, 'transactions').query,
        displayProperty: 'open',
        options: [
            { text: 'Open', value: 'open' },
            { text: 'Committed', value: 'committed' },
            { text: 'Rolled Back', value: 'rolledBack' },
            { text: 'Peak Concurrent', value: 'concurrent' },
        ],
    };

    augmentData = (/* node */) => (/* data */) => {
        // TBD -- we can use this to compute committed/sec if we want.
        return {};
    };

    dataFeedMaker = member => {
        const halin = window.halinContext;

        const addr = member.getBoltAddress();
        const allColumns = _.cloneDeep(queryLibrary.JMX_TRANSACTIONS.columns)
            .concat(_.cloneDeep(queryLibrary.JMX_TRANSACTIONS.legendOnlyColumns));

        const feed = halin.getDataFeed({
            node: member,
            query: this.state.query,
            rate: this.state.rate,
            displayColumns: allColumns,
            params: {
                db: halin.getClusterManager().getDefaultDatabase().name,
            },
        });

        feed.addAliases({
            open: ClusterTimeseries.keyFor(addr, 'open'),
            committed: ClusterTimeseries.keyFor(addr, 'committed'),
            rolledBack: ClusterTimeseries.keyFor(addr, 'rolledBack'),
            concurrent: ClusterTimeseries.keyFor(addr, 'concurrent'),
        });

        feed.addAugmentationFunction(this.augmentData(member));
        return feed;
    };

    onChange = (e, data) => {
        const a = {
            displayProperty: data.value,
        };
        this.setState(a);
    };

    render() {
        return (
            <HalinCard header='Transactions' knowledgebase='TransactionsOpen' owner={this}>
                <Dropdown style={{paddingBottom: 10}}
                    placeholder='Show:'
                    fluid defaultValue='open'
                    onChange={this.onChange}
                    selection
                    options={this.state.options}
                />

                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    feedMaker={this.dataFeedMaker}
                    // onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </HalinCard>
        )
    }
}

export default hoc.enterpriseOnlyComponent(TransactionsOpen, 'Transactions');
