import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from '../../../api';
import neo4j from '../../../api/driver';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import _ from 'lodash';
import hoc from '../../higherOrderComponents';
import { List, Icon } from 'semantic-ui-react';
import './ApocMetaStats.css';

const calculateDiffs = (latest, previous, timeElapsedInMs) => {
    if (!latest || !previous) { return {}; }
    const labels = Object.keys(latest.stats.labels);
    const relTypes = Object.keys(latest.stats.relTypes);

    const result = { labels: {}, relTypes: {} };

    labels.map(label => {
        const now = neo4j.handleNeo4jInt(latest.stats.labels[label] || 0);
        const then = neo4j.handleNeo4jInt(previous.stats.labels[label] || 0);
        const diff = now - then;

        // console.log(`Label ${label} now: ${now} then: ${then} difference of ${diff} over ${timeElapsedInMs}`);
        result.labels[label] = { diff, rate: timeElapsedInMs !== 0 ? diff/(timeElapsedInMs/1000): 0 };
        return true;
    });

    relTypes.forEach(relType => {
        const now = neo4j.handleNeo4jInt(latest.stats.relTypes[relType] || 0);
        const then = neo4j.handleNeo4jInt(previous.stats.relTypes[relType] || 0);
        const diff = now - then;

        result.relTypes[relType] = { diff, rate: timeElapsedInMs !== 0 ? diff/(timeElapsedInMs/1000) : 0 };
    });

    return result;
};

const pretty = num => api.datautil.humanNumberSize(num);

class ApocMetaStats extends Component {
    state = {
        data: {},
    };

    componentWillMount() {
        this.df = window.halinContext.getDataFeed({
            node: this.props.node,
            database: this.props.database,
            query: api.queryLibrary.APOC_COUNT_STORE.query,
            displayColumns: api.queryLibrary.APOC_COUNT_STORE.columns,
        });

        this.df.on('data', this.onData);
        this.df.addAugmentationFunction(this.augmentData);
    }

    componentDidMount() { this.mounted = true; }

    onData = (newData, dataFeed) => {
        if (this.mounted) {
            this.setState({ data: newData.data[0] });
        }
    }

    augmentData = (data) => {
        const packets = this.df.getDataPackets();
        const first = packets[0];
        const last = packets[packets.length - 1];
        
        // console.log("AUG Packets", packets, "Last packet", last, "current data", data);

        if (!first || !last) {
            console.log('Waiting on accumulation to calculate diffs');
            return {};
        }

        // How much time elapsed since the sample?
        // We know we've sampled N times (packet.length).  Each sample is df.rate apart in time.
        // And each sample took a certain number of ms to actually gather (sampleTime)
        const timeElapsedSinceFirst = (
            packets.length * this.df.rate + 
            packets.map(p => p._sampleTime).reduce(((a, b) => a+b), 0) + 
            data._sampleTime
        );

        // Same as above, but only one sample of time.
        const timeElapsedSinceLast = this.df.rate + last._sampleTime + data._sampleTime;

        const sinceStart = calculateDiffs(data, first, timeElapsedSinceFirst);
        const sinceLast = calculateDiffs(data, last, timeElapsedSinceLast);

        return { sinceStart, sinceLast };
    };

    componentWillUnmount() {
        this.mounted = false;
    }

    labelListEntry = (label, key) => {
        const count = pretty(api.driver.handleNeo4jInt(this.state.data.labels[label]));
        // const diff = _.get(this.state.data, `sinceStart.labels.${label}.diff`) || 0;
        const rate = _.get(this.state.data, `sinceStart.labels.${label}.rate`) || 0;

        let rateHuman = '';

        if (rate > 0) {
            rateHuman = <strong><Icon name='plus' color='green'/> {pretty(rate)}/sec</strong>;
        } else if (rate < 0) {
            rateHuman = <strong><Icon name='minus' color='red'/> {pretty(rate)}/sec</strong>;
        }

        return (
            <List.Item key={key}>{label}: {count} nodes {rateHuman}</List.Item>
        );
    };

    render() {
        const state = this.state.data;
        if(_.isEmpty(state)) { return ''; }
        
        return (
            <div>
                <p>{pretty(state.nodeCount)} nodes, {pretty(state.relCount)} relationships, and
                &nbsp;{pretty(state.propertyKeyCount)} properties.</p>
    
                <h4>Labels</h4>
                <List id='label_list'>
                    {
                        Object.keys(state.labels).length === 0 ? 'None' :
                            Object.keys(state.labels).sort().map((label, i) => this.labelListEntry(label, i))
                    }
                </List>
    
                <h4>Relationships</h4>
                <List id='rel_list'>
                    {
                        Object.keys(state.relTypes).length === 0 ? 'None' :
                            Object.keys(state.relTypes).sort().map((rt, i) =>
                                <List.Item key={i}>{rt}: {pretty(api.driver.handleNeo4jInt(state.relTypes[rt]))}</List.Item>)
                    }
                </List>
            </div>
        );        
    }
}

const Stats = hoc.apocOnlyComponent(ApocMetaStats);

class ApocMetaStatsCard extends Component {
    render() {
        return (
            <HalinCard id="ApocMetaStats">
                <h3>Database Statistics <Explainer knowledgebase='ApocMetaStats' /></h3>

                <Stats {...this.props} />
            </HalinCard>
        );
    };
}

ApocMetaStatsCard.props = {
    node: PropTypes.object.isRequired,
}

export default ApocMetaStatsCard;