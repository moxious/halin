import React from 'react';
import PropTypes from 'prop-types';

import api from '../../../api';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import CypherPieChart from '../../data/CypherPieChart/CypherPieChart';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

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