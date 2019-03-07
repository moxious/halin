import React, { Component } from 'react';
import Spinner from '../Spinner';
import _ from 'lodash';
import { Card } from 'semantic-ui-react';
import uuid from 'uuid';
import AllocationChart from './AllocationChart';
import datautil from '../data/util';
import queryLibrary from '../data/queries/query-library';
import HalinCard from '../common/HalinCard';
import './OSStats.css';

export default class OSStats extends Component {
    state = {
        id: uuid.v4(),
        pieWidth: 300,
        pieHeight: 300,
        data: {},
    }

    componentDidMount() {
        this.mounted = true;

        this.feed = window.halinContext.getDataFeed(_.merge({
            node: this.props.node,
        }, queryLibrary.OS_MEMORY_STATS));

        const setMyStateFromDataFeed = newData => {
            if (this.mounted && newData) {
                const data = _.cloneDeep(newData.data[0]);
                console.log('data',data);
                this.setState({ data });
            }
        };

        // Data feed may be running from prior.  Eliminate render wait by grabbing its initial
        // state.
        setMyStateFromDataFeed(this.feed.currentState());

        // Setup listener to do the same thing as new data arrives.
        const onDataListener = (newData, dataFeed) => setMyStateFromDataFeed(newData);
        this.feed.addListener(onDataListener);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    labelFor = key => {
        return _.get(this.state.displayColumns.filter(i => i.accessor === key)[0], 'Header') || key;
    }

    format = (key, value) => {
        const dataSizes = ['physFree', 'physTotal', 'virtCommitted',
            'swapFree', 'swapTotal'];

        if (dataSizes.indexOf(key) > -1) {
            return datautil.humanDataSize(value);
        }

        return value;
    }

    render() {
        const os = _.get(this.state.data, 'osName') || 'unknown';
        const version = _.get(this.state.data, 'osVersion') || 'unknown';
        const arch = _.get(this.state.data, 'arch') || 'unknown';
        const procs = _.get(this.state.data, 'processors') || 'unknown'

        const header = `${os} v${version} (${arch} architecture) with ${procs} cores`;

        return this.state.data ? (
            <div className='OSStats' key={this.state.id}>
                <h3>{header}</h3>

                <Card.Group itemsPerRow={3}>
                    <HalinCard header='Physical Memory'>
                        <AllocationChart
                            dataMeasurement={true}
                            free={this.state.data.physFree}
                            total={this.state.data.physTotal}
                        />
                    </HalinCard>
                    {/* Some systems don't have swap, in which case don't show the extra card. */}
                    { (this.state.data.swapTotal && this.state.data.swapTotal) > 0 ? 
                        <HalinCard header='Swap Memory'>
                            <AllocationChart
                                dataMeasurement={true}
                                free={this.state.data.swapFree}
                                total={this.state.data.swapTotal}
                            />
                        </HalinCard> : 
                        '' }
                    <HalinCard header='File Descriptors'>
                        <AllocationChart
                            free={this.state.data.fdOpen}
                            total={this.state.data.fdMax}
                        />
                    </HalinCard>
                </Card.Group>
            </div>
        ) : <Spinner active={true} />;
    }
};