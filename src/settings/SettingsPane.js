import React, { Component } from 'react';
import DataFeedStats from './DataFeedStats';

export default class SettingsPane extends Component {
    render() {
        // const style = {textAlign:'left'};
        return (
            <div className='SettingsPane'>
                <DataFeedStats />
            </div>
        )
    }
};