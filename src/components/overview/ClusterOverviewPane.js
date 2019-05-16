import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';

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
}

export default hoc.contentPaneComponent(ClusterOverviewPane);