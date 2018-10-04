import React, { Component } from 'react';
import Spinner from '../Spinner';
import _ from 'lodash';
import { Grid } from 'semantic-ui-react';
import uuid from 'uuid';
import AllocationChart from './AllocationChart';
import datautil from '../data/util';
import queryLibrary from '../data/query-library';

export default class OSStats extends Component {
    state = {
        id: uuid.v4(),
        rate: 1000,
        pieWidth: 300,
        pieHeight: 300,
        query: queryLibrary.OS_MEMORY_STATS.query,
        displayColumns: queryLibrary.OS_MEMORY_STATS.columns,
    }

    componentDidMount() {
        this.mounted = true;

        this.feed = window.halinContext.getDataFeed({
            node: this.props.node,
            driver: this.props.driver,
            query: this.state.query,
            rate: this.state.rate,
            windowWidth: 5000,
            displayColumns: this.state.displayColumns,
            params: {},
        });

        const onDataListener = (newData, dataFeed) => {
            // Don't need any of the timeseries stuff, just one data packet.
            // console.log(newData.data[0]);

            const data = _.cloneDeep(newData.data[0]);
            if (this.mounted) {
                this.setState({ data });
            }
        };

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
                <h4>{header}</h4>

                <Grid className='OSStats' key={this.state.id}>
                    <Grid.Row columns={3}>
                        <Grid.Column>
                            <AllocationChart
                                dataMeasurement={true}
                                free={this.state.data.physFree}
                                total={this.state.data.physTotal}
                                label="Physical Memory"
                            />
                        </Grid.Column>
                        <Grid.Column>
                            <AllocationChart
                                dataMeasurement={true}
                                free={this.state.data.swapFree}
                                total={this.state.data.swapTotal}
                                label="Swap Memory"
                            />
                        </Grid.Column>

                        <Grid.Column>
                            <AllocationChart
                                free={this.state.data.fdOpen}
                                total={this.state.data.fdMax}
                                label="File Descriptors"
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        ) : <Spinner active={true} />;
    }
};