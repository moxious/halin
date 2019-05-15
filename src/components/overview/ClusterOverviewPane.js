import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';

import ClusterMemory from './ClusterMemory';
import GCPauseTime from './GCPauseTime';
import PageCacheTracking from './PageCacheTracking';
import TransactionsOpen from './TransactionsOpen';
import UsedMemory from './UsedMemory';
import OpenFileDescriptors from './OpenFileDescriptors';

import hoc from '../higherOrderComponents';

class ClusterOverviewPane extends Component {
    render() {
        return (
            <div className="PerformancePane">
                <Grid divided='vertically'>
                    {/* <Grid.Row columns={1}>
                        <Grid.Column>
                            <ClusterView />
                        </Grid.Column>
                    </Grid.Row> */}

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
                            <PageCacheTracking />
                        </Grid.Column>

                        <Grid.Column>
                            <TransactionsOpen />
                        </Grid.Column>

                        <Grid.Column>
                            <OpenFileDescriptors />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default hoc.contentPaneComponent(ClusterOverviewPane);