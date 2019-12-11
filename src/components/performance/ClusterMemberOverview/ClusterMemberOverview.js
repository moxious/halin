import React from 'react';
import PropTypes from 'prop-types';

import { Card } from 'semantic-ui-react';

import MemoryMonitor from '../MemoryMonitor/MemoryMonitor';
import SystemLoad from '../SystemLoad/SystemLoad';
import TransactionMonitor from '../TransactionMonitor/TransactionMonitor';
// import DiskUtilizationPieChart from '../../database/DiskUtilizationPieChart/DiskUtilizationPieChart';

const ClusterMemberOverview = (props) => {
    return (
        <Card.Group itemsPerRow={2} className="ClusterMemberOverview">
            <SystemLoad node={props.node} />
            <MemoryMonitor node={props.node} />
            <TransactionMonitor node={props.node} />
            {/* <DiskUtilizationPieChart node={props.node} /> */}
        </Card.Group>
    );
}

ClusterMemberOverview.props = {
    node: PropTypes.object.isRequired, // TODO: shape?
}

export default ClusterMemberOverview;
