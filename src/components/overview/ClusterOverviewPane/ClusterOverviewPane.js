import React from 'react';
import { Card } from 'semantic-ui-react';

import ClusterMemory from '../ClusterMemory/ClusterMemory';
import GCPauseTime from '../GCPauseTime/GCPauseTime';
import PageCacheTracking from '../PageCacheTracking/PageCacheTracking';
import UsedMemory from '../UsedMemory/UsedMemory';

import hoc from '../../higherOrderComponents';

const ClusterOverviewPane = (props) =>
    <Card.Group itemsPerRow={2} className="ClusterOverviewPane">
        <ClusterMemory />
        <UsedMemory />
        <GCPauseTime />
        <PageCacheTracking />
    </Card.Group>;

export default hoc.contentPaneComponent(ClusterOverviewPane);