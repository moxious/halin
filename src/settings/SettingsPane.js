import React, { Component } from 'react';
import DataFeedStats from './DataFeedStats';
import ClusterResponseGraph from './ClusterResponseGraph';
import './SettingsPane.css';

const debug = false;

export default class SettingsPane extends Component {
    render() {
        // const style = {textAlign:'left'};
        return (
            <div className='SettingsPane'>
                { debug ? <ClusterResponseGraph/> : '' }

                <DataFeedStats />
            </div>
        )
    }
};