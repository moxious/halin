import React, { Component } from 'react';
import PropTypes from 'prop-types';

import api from '../../../api';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import hoc from '../../higherOrderComponents';
import { List } from 'semantic-ui-react';
import './ApocMetaStats.css';

class ApocMetaStats extends React.Component {
    state = {
        relCount: 0,
        nodeCount: 0,
        labelCount: 0,
        propertyKeyCount: 0,
        labels: {},
        relTypes: {},
    };

    componentDidMount(props) {
        console.log('apoc props', this.props);

        return this.props.node.run('CALL apoc.meta.stats()', {}, this.props.database.getLabel())
            .then(results => api.driver.unpackResults(results, {
                required: ['labelCount', 'relTypeCount', 'propertyKeyCount',
                    'nodeCount', 'relCount', 'labels', 
                    'relTypes', 'relTypesCount', 'stats'],
            }))
            .then(data => data[0] || null)
            .then(result => {
                console.log('STATS', result.stats);
                const s = result.stats;

                this.setState({
                    relCount: api.driver.handleNeo4jInt(s.relCount),
                    nodeCount: api.driver.handleNeo4jInt(s.nodeCount),
                    labelCount: api.driver.handleNeo4jInt(s.labelCount),
                    propertyKeyCount: api.driver.handleNeo4jInt(s.propertyKeyCount),
                    labels: s.labels,
                    relTypes: s.relTypes,
                });
            })
            .catch(err => {
                api.sentry.error('Error getting APOC meta stats', err);
                this.setState({ error: err });
            });
    }

    render() {
        if (this.state.error) { return 'An error occurred, please check back later'; }

        return (
            <div>
                <p>{ this.state.nodeCount } nodes, { this.state.relCount } relationships, and 
                &nbsp;{ this.state.propertyKeyCount } properties.</p>

                <h4>Labels</h4>
                <List id='label_list'>
                    { 
                        Object.keys(this.state.labels).length === 0 ? 'None' : 
                        Object.keys(this.state.labels).map((label,i) => 
                            <List.Item key={i}>{label}: {api.driver.handleNeo4jInt(this.state.labels[label])} nodes</List.Item>)
                    }
                </List>

                <h4>Relationships</h4>
                <List id='rel_list'>
                    { 
                        Object.keys(this.state.relTypes).length === 0 ? 'None' : 
                        Object.keys(this.state.relTypes).map((rt,i) => 
                            <List.Item key={i}>{rt}: {api.driver.handleNeo4jInt(this.state.relTypes[rt])}</List.Item>)
                    }
                </List>
            </div>
        );
    }
}

const Stats = hoc.apocOnlyComponent(ApocMetaStats);

class ApocMetaStatsCard extends React.Component {
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