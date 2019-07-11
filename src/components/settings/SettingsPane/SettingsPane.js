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
            <h3>About</h3>
            
            <Card.Group itemsPerRow={3}>
                <AppFooter />
                <ClusterResponseGraph/>
                <DetectedSettings />
            </Card.Group>               

            <h3>Data Feed Statistics</h3>

            <DataFeedStats />
        </div>
    );
}

export default hoc.contentPaneComponent(SettingsPane);