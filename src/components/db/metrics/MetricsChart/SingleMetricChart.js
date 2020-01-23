import React, { Component } from 'react';
import { styler, Charts, ChartContainer, ChartRow, YAxis, LineChart, EventMarker } from 'react-timeseries-charts';
import _ from 'lodash';
import uuid from 'uuid';
import moment from 'moment';
import { TimeSeries, TimeEvent } from 'pondjs';

import HalinCard from '../../../ui/scaffold/HalinCard/HalinCard';

/**
 * #operability
 * The data coming out of Neo4j Metric CSV files can be a bit wild and wooly.  It changed a lot from 
 * 3.4 -> 3.5.  Some metrics files will be missing unless you're in a clustered config.  And the fields
 * present change from metric to metric.  What's below is a complete list of known fields from 3.4 and 3.5
 * metrics across all files.
 * 
 * t, count, value, max, mean, min, mean_rate, m1_rate, m5_rate, m15_rate, p50
 * p75, p95, p98, p99, p999
 * 
 * T is the timestamp.  Most of the time the metric you want will be 'count' or 'value'.
 * 
 * Rather than keeping a large version depedent map of what each thing means under which version, we're 
 * going to do this by heuristic.
 */
const LABELS = {
    value: 'Value',
    count: 'Count',
    max: 'Maximum Value',
    mean: 'Mean Value',
    min: 'Minimum Value',
    mean_rate: 'Mean Rate',
    p50: '50th Percentile',
    p75: '75th Percentile',
    p95: '95th Percentile',
    p98: '98th Percentile',
    p99: '99th Percentile',
    p999: '99.9 Percentile',
};

const humanPrintNumber = val =>
    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const NullMarker = props => {
    return <g />;
};

export default class SingleMetricChart extends Component {
    state = {
        tracker: null,
        trackerValue: "-- °C",
        trackerEvent: null,
        markerMode: "flag",
        bumpFactor: 0.00,
    }

    getChartMin() {
        return Math.min(...this.props.data.map(d => Number(_.get(d.map, this.props.mapKey)))) * (1 - this.state.bumpFactor);
    }

    getChartMax() {
        return Math.max(...this.props.data.map(d => Number(_.get(d.map, this.props.mapKey)))) * (1 + this.state.bumpFactor);
    }

    renderMarker = () => {
        if (!this.state.tracker) {
            return <NullMarker />;
        }

        const infoStyle = {
            fill: 'white',
            stroke: 'black',
        };

        return (
            <EventMarker id='EventMarker'
                type="flag"
                axis="y"
                event={this.state.trackerEvent}
                column={this.props.mapKey}
                info={this.props.mapKey + ': ' + humanPrintNumber(this.state.trackerValue) }
                infoTimeFormat={() => moment(this.state.tracker).format('HH:mm:ss')}
                infoWidth={120}
                infoStyle={infoStyle}
                markerRadius={5}
                markerStyle={{ fill: "#2db3d1" }}
            />
        );
    };

    handleTrackerChanged = t => {
        if (t) {
            const e = this.state.dataSeries.atTime(t);
            const eventTime = new Date(
                e.begin().getTime() + (e.end().getTime() - e.begin().getTime()) / 2
            );
            const eventValue = e.get(this.props.mapKey);
            const v = `${eventValue}`;
            console.log('Time', eventTime, 'value', eventValue);
            this.setState({ tracker: eventTime, trackerValue: v, trackerEvent: e });
        } else {
            this.setState({ tracker: null, trackerValue: null, trackerEvent: null });
        }
    };

    componentWillMount() {
        const mapKey = this.props.mapKey;
        const displayColumns = [{ accessor: mapKey }];
        return this.setState({
            displayColumns,
            style: styler(displayColumns.map((col) => ({
                key: col.accessor,
                color: '#000000',
                width: 3,
            }))),
            dataSeries: new TimeSeries({
                name: 'Data Series',
                events: this.props.data.map(v => new TimeEvent(v.t, { [mapKey]: Number(_.get(v.map, mapKey)) })),
            }),
            header: LABELS[mapKey] || mapKey,
        });
    }

    render() {
        console.log('MIN',this.getChartMin(),'MAX',this.getChartMax());

        return (
            <HalinCard className='MetricsChart' header={this.state.header} key={uuid.v4()}>
                <ChartContainer className='MetricsChart'
                    showGrid={false}
                    showGridPosition='under'
                    width={this.props.width || 380}
                    enablePanZoom={false}
                    timeAxisAngledLabels={true}
                    timeAxisHeight={65}
                    onTrackerChanged={this.handleTrackerChanged}
                    timeRange={this.props.timeRange}>
                    <ChartRow height="150">
                        <YAxis id="y"
                            min={this.getChartMin()}
                            max={this.getChartMax()}
                            width="70"
                            ticks={5}
                            format={humanPrintNumber}
                            showGrid={false}
                            type="linear" />
                        <Charts>
                            {
                                this.state.displayColumns.map((col, idx) =>
                                    <LineChart key={`ct-${idx}`}
                                        axis="y"
                                        style={this.state.style}
                                        columns={[col.accessor]}
                                        series={this.state.dataSeries}
                                    />
                                )
                            }
                            {this.renderMarker()}
                        </Charts>
                    </ChartRow>
                </ChartContainer>
            </HalinCard>
        );
    }
}