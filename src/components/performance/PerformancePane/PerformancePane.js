import React from 'react';
import PropTypes from 'prop-types';

import { Card } from 'semantic-ui-react';

import MemoryMonitor from '../MemoryMonitor/MemoryMonitor';
import SystemLoad from '../SystemLoad/SystemLoad';
import TransactionMonitor from '../TransactionMonitor/TransactionMonitor';
// import DiskUtilizationPieChart from '../../database/DiskUtilizationPieChart/DiskUtilizationPieChart';

const PerformancePane = (props) => {
    return (
        <Card.Group itemsPerRow={2} className="PerformancePane">
            <SystemLoad node={props.node} />
            <MemoryMonitor node={props.node} />
            <TransactionMonitor node={props.node} />
            {/* <DiskUtilizationPieChart node={props.node} /> */}
        </Card.Group>
    );
}

PerformancePane.props = {
    node: PropTypes.object.isRequired, // TODO: shape?
}

export default PerformancePane;
