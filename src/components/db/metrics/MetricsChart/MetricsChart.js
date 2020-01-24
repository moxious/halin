import React, { PureComponent } from 'react';
import _ from 'lodash';
import { TimeRange } from 'pondjs';
import { Card } from 'semantic-ui-react';

import api from '../../../../api';
import SingleMetricChart from './SingleMetricChart';

const { timewindow } = api;

/**
 * This component takes a bunch of data from Neo4j records, splits it out into a number of different
 * individual metrics streams (mean rate, count, etc) and renders a SingleMetricChart per map key.
 */
export default class MetricsChart extends PureComponent {
    displayTimeRange() {
        const data = this.props.data;
        const timings = data.map(v => v.t.getTime());
        const startTime = Math.min(...timings);
        const endTime = Math.max(...timings);

        return timewindow.displayTimeRange(new TimeRange(new Date(startTime), new Date(endTime)));
    }

    render() {
        const rawObservations = this.props.data;

        if (rawObservations.length > 0) {
            const first = rawObservations[0];

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
                {this.numericKeys.map((numericKey, i) =>
                    <SingleMetricChart
                        key={i}
                        mapKey={numericKey}
                        data={this.props.data}
                        timeRange={this.displayTimeRange()}
                    />)}
            </Card.Group>
        );
    }
}