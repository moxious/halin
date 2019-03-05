import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';

import ClusterMemory from './ClusterMemory';
import GCPauseTime from './GCPauseTime';
// import PageCacheFaults from './PageCacheFaults';
// import PageCacheFlushes from './PageCacheFlushes';
import PageCacheTracking from './PageCacheTracking';
import TransactionsOpen from './TransactionsOpen';
import UsedMemory from './UsedMemory';
import OpenFileDescriptors from './OpenFileDescriptors';
// import ClusterView from './ClusterView';

export default class ClusterOverviewPane extends Component {
    render() {
        return (
            <Card.Group itemsPerRow={3} className="PerformancePane">
                <ClusterMemory />
                <UsedMemory />
                <GCPauseTime />
                <PageCacheTracking />
                <TransactionsOpen />
                <OpenFileDescriptors />
            </Card.Group>
        );
    }
};

