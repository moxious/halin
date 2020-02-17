import React from 'react';

import DataFeedStats from '../DataFeedStats/DataFeedStats';
import AppFooter from '../../ui/scaffold/AppFooter/AppFooter';
import ClusterResponseGraph from '../ClusterResponseGraph/ClusterResponseGraph';
import DetectedSettings from '../DetectedSettings/DetectedSettings';
import { Card } from 'semantic-ui-react';

import './SettingsPane.css';
import hoc from '../../higherOrderComponents';

const SettingsPane = (props) => {
    return (
        <div className='SettingsPane'>
            <Card.Group style={{marginBottom: 15}} itemsPerRow={3}>
                <AppFooter />
                <DetectedSettings />
            </Card.Group>               

            <DataFeedStats />
            
            <ClusterResponseGraph />
        </div>
    );
}

export default hoc.contentPaneComponent(SettingsPane);