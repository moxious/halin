import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';

import MemoryMonitor from '../MemoryMonitor/MemoryMonitor';
import SystemLoad from '../SystemLoad/SystemLoad';
import TransactionMonitor from '../TransactionMonitor/TransactionMonitor';
import DiskUtilizationPieChart from '../DiskUtilizationPieChart/DiskUtilizationPieChart';

export default class PerformancePane extends Component {
    render() {
        return (
            <Card.Group itemsPerRow={2} className="PerformancePane">
                <SystemLoad node={this.props.node} />
                <MemoryMonitor node={this.props.node} />
                <TransactionMonitor node={this.props.node} />
                <DiskUtilizationPieChart node={this.props.node} />
            </Card.Group>
        );
    }
}
