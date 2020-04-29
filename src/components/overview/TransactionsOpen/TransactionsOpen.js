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
            /* #operability: this JMX metric is a mixture of cumulative and instant data :( */
            { text: 'Open', value: 'open' }, /* INSTANTANEOUS */
            // { text: 'Committed', value: 'committed' }, /* CUMULATIVE */
            // { text: 'Rolled Back', value: 'rolledBack' }, /* CUMULATIVE */
            { text: 'Committed', value: 'committedInstant' }, /* Augmentation function */
            { text: 'Rolled Back', value: 'rolledBackInstant' }, /* Augmentation function */
            { text: 'Peak Concurrent', value: 'concurrent' },
        ],
    };

    /**
     * We need to calculate the instant values of committed and rolled back TXs from the 
     * cumulative numbers that the JMX feed actually gives us.   :/
     */
    augmentData = (/* node */) => (newPacket, dataFeed) => {
        // TBD -- we can use this to compute committed/sec if we want.
        const oldState = _.get(dataFeed.currentState(), 'data[0]') || {};        

        // On the first packet, if there is no old state, then we want the difference to be
        // zero.  Otherwise this causes a huge spike as the first observation inherits the full
        // cumulative committed load.
        const oldCommitted = oldState.committed || newPacket.committed;
        const oldRolledBack = oldState.rolledBack || newPacket.rolledBack;

        const aug = { 
            rolledBackInstant: (newPacket.rolledBack || 0) - oldRolledBack,
            committedInstant: (newPacket.committed || 0) - oldCommitted,
        };
        // console.log('AUG', aug, 'FROM OLD', oldState, 'NEW', newPacket);
        return aug;
    };

    dataFeedMaker = member => {
        const halin = window.halinContext;

        const addr = member.getBoltAddress();
        const allColumns = _.cloneDeep(queryLibrary.JMX_TRANSACTIONS.columns)
            .concat(_.cloneDeep(queryLibrary.JMX_TRANSACTIONS.legendOnlyColumns));

        console.log('Making TX data feed for ', this.props.database.getLabel());

        const feed = halin.getDataFeed({
            node: member,
            database: this.props.database.getLabel(),
            query: this.state.query,
            rate: this.state.rate,
            displayColumns: allColumns,
            params: {
                db: this.props.database.getLabel(),
            },
        });

        feed.addAliases({
            open: ClusterTimeseries.keyFor(addr, 'open'),
            committed: ClusterTimeseries.keyFor(addr, 'committed'),
            rolledBack: ClusterTimeseries.keyFor(addr, 'rolledBack'),
            concurrent: ClusterTimeseries.keyFor(addr, 'concurrent'),
            rolledBackInstant: ClusterTimeseries.keyFor(addr, 'rolledBackInstant'),
            committedInstant: ClusterTimeseries.keyFor(addr, 'committedInstant'),
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
                    database={this.props.database}
                    debug={true}
                    // onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </HalinCard>
        )
    }
}

export default hoc.enterpriseOnlyComponent(TransactionsOpen, 'Transactions');
