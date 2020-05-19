import React, { Component, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../../../api';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import hoc from '../../higherOrderComponents';
import { List } from 'semantic-ui-react';
import './ApocMetaStats.css';

/**
 * Gathers stats and returns a new state object.
 * @param {ClusterMember} node 
 * @param {Database} database 
 */
const gatherStats = (node, database) => {
    if (!node || !database) { return null; }
    if (database.isReconciling()) {
        // Database has multiple statuses, and it's not safe to do this operation at this moment.
        return Promise.resolve({ reconciling: true });
    }

    if (database.getLabel() === api.driver.SYSTEM_DB) {
        return Promise.resolve({
            message: 'This database does not contain inspectable data',
            error: null,
        });
    } else if(database.getStatus() !== 'online') {
        return Promise.resolve({
            message: 'This database is not online.  Please start it to see statistics.',
            error: null,
        });
    }

    return node.run('CALL apoc.meta.stats()', {}, database.getLabel())
        .then(results => api.driver.unpackResults(results, {
            required: ['labelCount', 'relTypeCount', 'propertyKeyCount',
                'nodeCount', 'relCount', 'labels',
                'relTypes', 'relTypesCount', 'stats'],
        }))
        .then(data => data[0] || null)
        .then(result => {
            const s = result.stats;

            return {
                relCount: api.driver.handleNeo4jInt(s.relCount),
                nodeCount: api.driver.handleNeo4jInt(s.nodeCount),
                labelCount: api.driver.handleNeo4jInt(s.labelCount),
                propertyKeyCount: api.driver.handleNeo4jInt(s.propertyKeyCount),
                labels: s.labels,
                relTypes: s.relTypes,
                message: null,
                error: null,
            };
        })
        .catch(err => {
            api.sentry.error('Error getting APOC meta stats', err);
            return { error: err, message: null };
        });
};

const defaultState = {
    relCount: 0,
    nodeCount: 0,
    labelCount: 0,
    propertyKeyCount: 0,
    labels: {},
    relTypes: {},
    message: null,
};

const ApocMetaStats = (props) => {
    const [state, setStats] = useState(defaultState);
    useEffect(() => {
       async function getStats() {
           const state = await gatherStats(props.node, props.database);
           setStats(state);
       }
       getStats();
    }, [props.database, props.node]);

    if (state.reconciling) {
        return <div>
            Database is reconciling; please wait until it is fully online for stats to appear.
            </div>;
    }

    if (state.error) { return <div>{state.error}</div>; }
    if (state.message) { return <div>{state.message}</div>; }

    return (
        <div>
            <p>{state.nodeCount} nodes, {state.relCount} relationships, and
            &nbsp;{state.propertyKeyCount} properties.</p>

            <h4>Labels</h4>
            <List id='label_list'>
                {
                    Object.keys(state.labels).length === 0 ? 'None' :
                        Object.keys(state.labels).map((label, i) =>
                            <List.Item key={i}>{label}: {api.driver.handleNeo4jInt(state.labels[label])} nodes</List.Item>)
                }
            </List>

            <h4>Relationships</h4>
            <List id='rel_list'>
                {
                    Object.keys(state.relTypes).length === 0 ? 'None' :
                        Object.keys(state.relTypes).map((rt, i) =>
                            <List.Item key={i}>{rt}: {api.driver.handleNeo4jInt(state.relTypes[rt])}</List.Item>)
                }
            </List>
        </div>
    );
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