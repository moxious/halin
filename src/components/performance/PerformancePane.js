import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react';
import uuid from 'uuid';

import api from '../../api/';

import MemoryMonitor from './MemoryMonitor';
import SystemLoad from './SystemLoad';
import TransactionMonitor from './TransactionMonitor';
import CypherPieChart from '../data/CypherPieChart/CypherPieChart';

export default class PerformancePane extends Component {
    render() {
        const key = uuid.v4();

        return (
            <div className="PerformancePane">
                <Grid divided='vertically'>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <SystemLoad key={key} node={this.props.node} />
                        </Grid.Column>

                        <Grid.Column>
                            <MemoryMonitor key={key} node={this.props.node} />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <TransactionMonitor key={key} node={this.props.node} />
                        </Grid.Column>

                        <Grid.Column>
                            <CypherPieChart
                                query={api.queryLibrary.JMX_DISK_UTILIZATION.query}
                                member={this.props.node}
                                title="Title"
                                label="Disk Utilization"
                                units="GB" />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>  
            </div>
        );
    }
}
