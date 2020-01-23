import React, { Component } from 'react';
import { styler, Charts, ChartContainer, ChartRow, YAxis, LineChart } from 'react-timeseries-charts';
import _ from 'lodash';
import uuid from 'uuid';
import {
    TimeSeries,
    TimeRange,
    TimeEvent,
} from 'pondjs';

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

export default class SingleMetricChart extends Component {
    getChartMin() {
        return Math.min(...this.props.data.map(d => Number(_.get(d.map, this.props.mapKey))))
    }

    getChartMax() {
        return Math.max(...this.props.data.map(d => Number(_.get(d.map, this.props.mapKey))));
    }

    render() {
        const mapKey = this.props.mapKey;
        const displayColumns = [ { accessor: mapKey } ];

        const style = styler(displayColumns.map((col, idx) => ({
            key: col.accessor,
            color: '#000000',
            width: 3,
        })));
        
        const rawObservations = this.props.data;
        const dataSeries = new TimeSeries({
            name: 'Data Series',
            events: rawObservations.map(v => new TimeEvent(v.t, { [mapKey]: Number(_.get(v.map, mapKey)) })),
        });

        const header = LABELS[this.props.mapKey] || this.props.mapKey;
        // console.log('DATA SERIES FOR ', header, mapKey, rawObservations.map(v => Number(_.get(v.map, mapKey))));

        return (
            <HalinCard className='MetricsChart' header={header} key={uuid.v4()}>
                <ChartContainer className='MetricsChart'
                    showGrid={true}                    
                    showGridPosition='under'
                    width={this.props.width || 380}
                    enablePanZoom={false}
                    timeAxisAngledLabels={true}
                    timeAxisHeight={65}
                    timeRange={this.props.timeRange}>
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
                                        series={dataSeries}
                                    />
                                )
                            }
                        </Charts>
                    </ChartRow>
                </ChartContainer>
            </HalinCard>
        );
    }
}