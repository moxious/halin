import React, { PureComponent } from 'react';
import _ from 'lodash';
import uuid from 'uuid';
import {
    TimeSeries,
    TimeRange,
    TimeEvent,
} from 'pondjs';
import { styler, Charts, ChartContainer, ChartRow, YAxis, LineChart } from 'react-timeseries-charts';
import { Card } from 'semantic-ui-react';

import api from '../../../../api';
import HalinCard from '../../../ui/scaffold/HalinCard/HalinCard';

const { timewindow } = api;

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

export default class MetricsChart extends PureComponent {
    getChartMin(mapKey='value') {
        return Math.min(...this.props.data.map(d => _.get(d.map, mapKey)))
    }

    getChartMax(mapKey='value') {
        return Math.max(...this.props.data.map(d => _.get(d.map, mapKey)));
    }

    displayTimeRange() {
        const data = this.props.data;
        const timings = data.map(v => v.t.getTime());
        const startTime = Math.min(...timings);
        const endTime = Math.max(...timings);

        return timewindow.displayTimeRange(new TimeRange(new Date(startTime), new Date(endTime)));
    }

    componentWillMount() {
        // This is a default/guess of which key into the map to use to display this metric.
        // Will be revised.
        this.mapKey = 'value';
    }

    chartFor(mapKey) {
        const displayColumns = [ { accessor: mapKey } ];

        const style = styler(displayColumns.map((col, idx) => ({
            key: col.accessor,
            color: '#000000',
            width: 3,
        })));
        
        const rawObservations = this.props.data;
        const dataSeries = new TimeSeries({
            name: 'Data Series',
            events: rawObservations.map(v => new TimeEvent(v.t, { [mapKey]: _.get(v.map, mapKey) })),
        });

        const header = LABELS[mapKey] || mapKey;

        return (
            <HalinCard className='MetricsChart' header={header} key={uuid.v4()}>
                <ChartContainer className='MetricsChart'
                    showGrid={true}                    
                    showGridPosition='under'
                    width={this.props.width || 380}
                    enablePanZoom={false}
                    timeAxisAngledLabels={true}
                    timeAxisHeight={65}
                    timeRange={this.displayTimeRange()}>
                    <ChartRow height="150">
                        <YAxis id="y"
                            min={this.getChartMin(mapKey)}
                            max={this.getChartMax(mapKey)}
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

    render() {
        const rawObservations = this.props.data;

        if (rawObservations.length > 0) {
            const first = rawObservations[0];
            console.log(first);
 
            // Of all of the keys, filter down to only those which are numeric metrics.
            this.numericKeys = Object.keys(first.map).map(key => ({ key, val: _.get(first.map, key) }))
                .filter(entry => {
                    // The "count" and "value" keys are always numeric, even if server did not
                    // type convert them to numbers for us.  And they should always be included.
                    // All the rest just depends on what the metric is and what was sent.
                    return entry.key === 'count' || entry.key === 'value' || _.isNumber(entry.val);
                }).map(entry => entry.key);
        } else {
            // Safe default?
            this.numericKeys = ['value'];
        }

        return (
            <Card.Group className='MetricsChartContainer'>
                {/* One chart per graphable metric! */}
                { this.numericKeys.map(numericKey => this.chartFor(numericKey)) }
            </Card.Group>
        );
    }
}