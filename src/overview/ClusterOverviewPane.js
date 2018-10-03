import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';

import ClusterMemory from './ClusterMemory';
import GCPauseTime from './GCPauseTime';
import PageCacheFaults from './PageCacheFaults';
import PageCacheFlushes from './PageCacheFlushes';
import TransactionsOpen from './TransactionsOpen';
import UsedMemory from './UsedMemory';
import OpenFileDescriptors from './OpenFileDescriptors';

export default class ClusterOverviewPane extends Component {
    render() {
        return (
            <div className="PerformancePane">
                <Grid divided='vertically'>
                    <Grid.Row columns={3}>
                        <Grid.Column>
                            <ClusterMemory />
                        </Grid.Column>

                        <Grid.Column>
                            <UsedMemory />
                        </Grid.Column>

                        <Grid.Column>
                            <GCPauseTime />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={3}>
                        <Grid.Column>
                            <PageCacheFaults />
                        </Grid.Column>

                        <Grid.Column>
                            <PageCacheFlushes />
                        </Grid.Column>

                        <Grid.Column>
                            <OpenFileDescriptors />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={3}>
                        <Grid.Column>
                            <TransactionsOpen />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
};

