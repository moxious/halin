import React, { Component } from 'react';
import queryLibrary from '../../api/data/queries/query-library';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';
import _ from 'lodash';
import { Chart } from 'react-google-charts';
import sentry from '../../api/sentry';
// import { List } from 'semantic-ui-react';

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
                rate: 2000,  // Poll every 2 sec
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

    

    getMin() {
        return Math.min(...Object.values(this.state.lastTxIds));
    }

    getMax() { 
        return Math.max(...Object.values(this.state.lastTxIds));
    }
    
    /**
     * Returns true if all cluster members have the same tx ID, false otherwise.
     */
    allCaughtUp() {
        return this.getMin() === this.getMax();
    }

    getRaceChart() {
        const ctx = window.halinContext;

        const writeMember = ctx.getWriteMember();
        const leadingValue = this.state.lastTxIds[writeMember.getBoltAddress()];

        const restMembers = ctx.members()
            .filter(m => m !== writeMember);

        // Those members that are "even" or caught up are those whose last TX ID
        // matches the leaders.
        const even = restMembers.filter(m => this.state.lastTxIds[m.getBoltAddress()] === leadingValue)
            .map(m => ({ 
                member: m, 
                value: leadingValue,
                laggingBy: 0,
             }));
        
        // Anybody else is behind.
        const behind = restMembers.filter(m => this.state.lastTxIds[m.getBoltAddress()] < leadingValue)
            .map(m => ({ 
                member: m, 
                value: this.state.lastTxIds[m],
                laggingBy: leadingValue - this.state.lastTxIds[m.getBoltAddress()],
            }));

        // This should never happen but we're checking in case assumptions get violated.
        const bizarro = restMembers.filter(m => this.state.lastTxIds[m.getBoltAddress()] > leadingValue);
        if (bizarro.length > 0) {
            const addrs = bizarro.map(m => m.getBoltAddress()).join(', ');
            const s = JSON.stringify(this.state.lastTxIds, null, 2);
            sentry.reportError(`
                Very strange error, please investigate.  Cluster write member is
                ${ctx.getWriteMember().getBoltAddress()}, but 
                members ${addrs} are AHEAD of the write member in TX ID!
                ${s}`);
        }

        return {
            leader: {
                member: writeMember,
                value: leadingValue,
            },
            even,
            behind,
        };
    }

    render() {
        const DEFAULT_PALETTE = [
            '#f68b24', 'steelblue', '#619F3A', '#dfecd7', '#e14594', '#7045af', '#2b3595',
        ];

        const bars = window.halinContext.members().map((m, i) => {
            const value = this.state.lastTxIds[m.getBoltAddress()];
            const label = m.getLabel();
            const color = DEFAULT_PALETTE[m % DEFAULT_PALETTE.length];
            return [label, value, color, null];
        });

        // https://react-google-charts.com/bar-chart#labeling-bars
        const allData = [
            [
                'Member',
                'Last TX ID',
                { role: 'style' },
                {
                    sourceColumn: 0,
                    role: 'annotation',
                    type: 'string',
                    calc: 'stringify',
                },
            ],
        ].concat(bars);

        console.log('MIN ', this.getMin(), ' MAX ', this.getMax());
        const raceChart = this.getRaceChart();
        console.log('Chart', raceChart);

        // const listify = stuff => stuff.length > 0 ? 
        //     <List>
        //         { stuff.map((i, k) => 
        //             <List.Item key={k}>
        //                 {i.member.getLabel()}: {i.laggingBy} behind
        //             </List.Item>)
        //         }
        //     </List> : 'None';

        return (
            <HalinCard header='Cluster Transactions'>
                {/* <h5>Leader: {raceChart.leader.member.getLabel()}</h5>
                
                <p>Transaction ID {raceChart.leader.value}</p>

                <h5>Even</h5>
                { listify(raceChart.even) }

                <h5>Behind</h5>
                { listify(raceChart.behind) } */}
                <Chart
                    width={'500px'}
                    height={'300px'}
                    chartType="BarChart"
                    loader={<div>Loading Chart</div>}
                    data={allData}
                    options={{
                        title: 'Last Committed TX ID',
                        width: this.props.width || 380,
                        height: this.props.height || 185,
                        bar: { groupWidth: '95%' },
                        legend: { position: 'none' },
                        hAxis: {
                            minValue: this.getMin() - 1,
                            maxValue: this.getMax() + 1,
                        },
                    }}
                    // For tests
                    rootProps={{ 'data-testid': '6' }}
                />
            </HalinCard>
        );
    }
};

