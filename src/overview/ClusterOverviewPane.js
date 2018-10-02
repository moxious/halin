import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';

import ClusterMemory from './ClusterMemory';
import GCPauseTime from './GCPauseTime';
import PageCacheFaults from './PageCacheFaults';
import TransactionsOpen from './TransactionsOpen';

export default class ClusterOverviewPane extends Component {
    render() {
        return (
            <div className="PerformancePane">
                <Grid divided='vertically'>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <ClusterMemory />
                        </Grid.Column>

                        <Grid.Column>
                            <GCPauseTime />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <PageCacheFaults />
                        </Grid.Column>

                        <Grid.Column>
                            <TransactionsOpen />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
};

