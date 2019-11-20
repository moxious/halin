import React from 'react';
import PropTypes from 'prop-types';

import api from '../../../api';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import CypherPieChart from '../../data/CypherPieChart/CypherPieChart';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

// In Neo4j 4 they took away ability to see components of store sizes, and replaced
// it with a JMX component that just gives total bytes of storage for an entire
// database, e.g. "neo4j.metrics:name=neo4j.neo4j.store.size.total"
// So this component isn't really useful >= Neo4j 4.0.
const DiskUtilizationPieChart = (props) => {
    return (
        <HalinCard>
            <h3>Data on Disk <Explainer knowledgebase='DiskUtilization' /></h3>

            <CypherPieChart
                query={api.queryLibrary.JMX_DISK_UTILIZATION.query}
                member={props.node}
                title="Title"
                units="GB" />
        </HalinCard>
    );
};

DiskUtilizationPieChart.props = {
    node: PropTypes.object.isRequired, // TODO: shape?
}

export default DiskUtilizationPieChart;