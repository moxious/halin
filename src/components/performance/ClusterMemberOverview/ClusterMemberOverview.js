import React from 'react';
import PropTypes from 'prop-types';

import { Card } from 'semantic-ui-react';
import MemberOverviewCard from '../MemberOverviewCard/MemberOverviewCard';
import MemoryMonitor from '../MemoryMonitor/MemoryMonitor';
import SystemLoad from '../SystemLoad/SystemLoad';
import TransactionMonitor from '../TransactionMonitor/TransactionMonitor';
// import DiskUtilizationPieChart from '../../database/DiskUtilizationPieChart/DiskUtilizationPieChart';

const ClusterMemberOverview = (props) => {
    return (
        <Card.Group itemsPerRow={2} className="ClusterMemberOverview">
            <MemberOverviewCard member={props.member} />
            <SystemLoad member={props.member} />
            <MemoryMonitor member={props.member} />
            <TransactionMonitor member={props.member} />
            {/* <DiskUtilizationPieChart node={props.node} /> */}
        </Card.Group>
    );
}

ClusterMemberOverview.props = {
    node: PropTypes.object.isRequired, // TODO: shape?
}

export default ClusterMemberOverview;
