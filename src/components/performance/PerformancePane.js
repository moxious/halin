import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Card } from 'semantic-ui-react';

import MemoryMonitor from './MemoryMonitor';
import SystemLoad from './SystemLoad';
import TransactionMonitor from './TransactionMonitor';
import DiskUtilizationPieChart from './DiskUtilizationPieChart/DiskUtilizationPieChart';

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
