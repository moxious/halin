import React, { Component } from 'react';
import DataFeedStats from '../DataFeedStats/DataFeedStats';
import ClusterResponseGraph from '../ClusterResponseGraph/ClusterResponseGraph';
import './SettingsPane.css';
import hoc from '../../higherOrderComponents';

class SettingsPane extends Component {
    render() {
        // const style = {textAlign:'left'};
        return (
            <div className='SettingsPane'>
                <h3>Settings</h3>
                
                <ClusterResponseGraph/>

                <h3>Data Feed Statistics</h3>

                <DataFeedStats />
            </div>
        )
    }
}

export default hoc.contentPaneComponent(SettingsPane);