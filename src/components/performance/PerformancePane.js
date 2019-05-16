import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Card } from 'semantic-ui-react';
import uuid from 'uuid';

import api from '../../api/';

import MemoryMonitor from './MemoryMonitor';
import SystemLoad from './SystemLoad';
import TransactionMonitor from './TransactionMonitor';
import CypherPieChart from '../data/CypherPieChart/CypherPieChart';
import HalinCard from '../ui/scaffold/HalinCard/HalinCard';

export default class PerformancePane extends Component {
    render() {
        const key = uuid.v4();

        return (
            <Card.Group itemsPerRow={2} className="PerformancePane">
                <SystemLoad key={key} node={this.props.node} />
                <MemoryMonitor key={key} node={this.props.node} />
                <TransactionMonitor key={key} node={this.props.node} />
                <HalinCard>
                    <CypherPieChart
                        query={api.queryLibrary.JMX_DISK_UTILIZATION.query}
                        member={this.props.node}
                        title="Title"
                        label="Disk Utilization"
                        units="GB" />
                </HalinCard>                                
            </Card.Group>
        );
    }
}
