import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import uuid from 'uuid';
import { Button } from 'semantic-ui-react';
import queryLibrary from '../data/query-library';
import _ from 'lodash';
import hoc from '../higherOrderComponents';

class TransactionsOpen extends Component {
    state = {
        key: uuid.v4(),
        rate: 2000,
        width: 400,
        query: queryLibrary.JMX_TRANSACTIONS.query,
        displayProperty: 'open',
    };

    onUpdate = (childQueryState) => {
        // console.log('TransactionsOpen update',childQueryState);
    };

    toggleView = (val) => {
        console.log('toggle',val);
        this.setState({ displayProperty: val });
    };

    augmentData = (node) => (data) => {
        // TBD -- we can use this to compute committed/sec if we want.
        return {};
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const driver = halin.driverFor(addr);

        const allColumns = _.cloneDeep(queryLibrary.JMX_TRANSACTIONS.columns)
            .concat(_.cloneDeep(queryLibrary.JMX_TRANSACTIONS.legendOnlyColumns));

        const feed = halin.getDataFeed({
            node,
            driver,
            query: this.state.query,
            rate: this.state.rate,
            displayColumns: allColumns,
        });

        feed.addAliases({
            open: ClusterTimeseries.keyFor(addr, 'open'),
            committed: ClusterTimeseries.keyFor(addr, 'committed'),
            rolledBack: ClusterTimeseries.keyFor(addr, 'rolledBack'),
            concurrent: ClusterTimeseries.keyFor(addr, 'concurrent'),
        });

        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    render() {
        const buttons = [
            { label: 'Open', field: 'open' },
            { label: 'Committed', field: 'committed' },
            { label: 'Rolled Back', field: 'rolledBack' },
            { label: 'Peak Concurrent', field: 'concurrent' },
        ];

        return (
            <div className="TransactionMonitor">
                <h3>Transactions</h3>
                
                <Button.Group size='tiny' style={{paddingBottom: '15px'}}>{
                    buttons.map((b,idx) =>
                        <Button size='tiny'
                            key={idx}
                            active={this.state.displayProperty===b.field}
                            onClick={() => this.toggleView(b.field)}>
                            { b.label }
                        </Button>)
                }</Button.Group>

                <ClusterTimeseries key={this.state.key}
                    query={this.state.query} 
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </div>
        )
    }
}

export default hoc.enterpriseOnlyComponent(TransactionsOpen, 'Transactions');
