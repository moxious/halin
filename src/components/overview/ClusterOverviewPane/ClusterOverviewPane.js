import React from 'react';
import { Card } from 'semantic-ui-react';

import ClusterMemory from '../ClusterMemory/ClusterMemory';
import GCPauseTime from '../GCPauseTime/GCPauseTime';
import PageCacheTracking from '../PageCacheTracking/PageCacheTracking';
import TransactionsOpen from '../TransactionsOpen/TransactionsOpen';
import UsedMemory from '../UsedMemory/UsedMemory';
import OpenFileDescriptors from '../OpenFileDescriptors/OpenFileDescriptors';

import hoc from '../../higherOrderComponents';

const ClusterOverviewPane = (props) => {
    return (
        <Card.Group itemsPerRow={3} className="PerformancePane">
            <ClusterMemory />
            <UsedMemory />
            <GCPauseTime />
            {/* <PageCacheTracking />
            <TransactionsOpen /> */}
            <OpenFileDescriptors />
        </Card.Group>
    );
}

export default hoc.contentPaneComponent(ClusterOverviewPane);