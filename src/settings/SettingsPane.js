import React, { Component } from 'react';

import _ from 'lodash';
import DataFeedStats from './DataFeedStats';

export default class SettingsPane extends Component {
    render() {
        const style = {textAlign:'left'};
        return (
            <div className='SettingsPane'>
                <h2>Halin Settings</h2>

                <DataFeedStats />
            </div>
        )
    }
};