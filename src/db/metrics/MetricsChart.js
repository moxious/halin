import React, { Component } from 'react';
import timewindow from '../../timeseries/timewindow';
import { styler, Charts, ChartContainer, ChartRow, YAxis, LineChart } from 'react-timeseries-charts';
import {
    TimeSeries,
    TimeRange,
    TimeEvent,
} from 'pondjs';

export default class MetricsChart extends Component {
    getChartMin() {
        return Math.min(...this.props.data.map(d => d.value));
    }

    getChartMax() {
        return Math.max(...this.props.data.map(d => d.value));
    }

    displayTimeRange() {
        const data = this.props.data;
        const timings = data.map(v => v.t.getTime());
        const startTime = Math.min(...timings);
        const endTime = Math.max(...timings);

        return timewindow.displayTimeRange(new TimeRange(new Date(startTime), new Date(endTime)));
    }

    render() {
        const rawObservations = this.props.data;
        this.dataSeries = new TimeSeries({
            name: 'Data Series',
            events: rawObservations.map(v => new TimeEvent(v.t, v.value)),
        });

        const displayColumns = [
            { Header: this.props.metric, accessor: 'value' },
        ];

        const style = styler(displayColumns.map((col, idx) => ({
            key: col.accessor,
            color: '#000000',
            width: 3,
        })));

        return (
            <ChartContainer className='MetricsChart'
                showGrid={true}
                showGridPosition='under'
                // width='100%'
                enablePanZoom={false}
                timeAxisAngledLabels={true}
                timeAxisHeight={65}
                timeRange={this.displayTimeRange()}>
                <ChartRow height="150">
                    <YAxis id="y"
                        min={this.getChartMin()}
                        max={this.getChartMax()}
                        width="70"
                        showGrid={true}
                        type="linear" />
                    <Charts>
                        {
                            displayColumns.map((col, idx) =>
                                <LineChart key={`ct-${idx}`}
                                    axis="y"
                                    style={style}
                                    columns={[col.accessor]}
                                    series={this.dataSeries}
                                />
                            )
                        }
                    </Charts>
                </ChartRow>
            </ChartContainer>
        );
    }
}