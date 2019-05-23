import React, { Component } from 'react';
import queryLibrary from '../../api/data/queries/query-library';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';
import _ from 'lodash';

export default class ClusterTransactionStatus extends Component {
    state = {
        // Keyed by bolt address maps addr -> last TX ID
        lastTxIds: {},

        // Keyed by bolt address maps addr -> data feed
        feeds: {},
    };

    onData(member, newData, dataFeed) {
        if (!this.mounted) { return; }

        const addr = member.getBoltAddress();
        const lastTxIds = _.cloneDeep(this.state.lastTxIds);

        console.log('NEWDATA', newData);
        const value = newData.data[0].value;
        _.set(lastTxIds, addr, value);

        return this.setState({ lastTxIds });
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidMount() {
        this.mounted = true;
        const halin = window.halinContext;
        const q = queryLibrary.JMX_LAST_TRANSACTION_ID;

        const feeds = {};
        const lastTxIds = {};

        this.onDataCallbacks = {};

        halin.members().forEach(member => {
            const addr = member.getBoltAddress();
            const feed = halin.getDataFeed({
                node: member,
                query: q.query,
                displayColumns: q.columns,
            });

            this.onDataCallbacks[addr] = (newData, dataFeed) =>
                this.onData(member, newData, dataFeed);

            feed.addListener(this.onDataCallbacks[addr]);
            feeds[addr] = feed;
            lastTxIds[addr] = 0;
        });

        this.setState({ feeds, lastTxIds });
    }

    render() {
        return (
            <HalinCard header='Cluster Transactions'>
                {
                    Object.keys(this.state.lastTxIds).map((key, i) => 
                        <p key={i}>{key}: {this.state.lastTxIds[key]}</p>)
                }
            </HalinCard>
        );
    }
};

