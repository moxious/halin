import React, { Component } from 'react';

import api from '../../../api';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import CypherPieChart from '../../data/CypherPieChart/CypherPieChart';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

export default class DiskUtilizationPieChart extends Component {
    render() {
        return (
            <HalinCard>
                <h3>Data on Disk <Explainer knowledgebase='DiskUtilization' /></h3>

                <CypherPieChart
                    query={api.queryLibrary.JMX_DISK_UTILIZATION.query}
                    member={this.props.node}
                    title="Title"
                    units="GB" />
            </HalinCard>
        );
    }
};