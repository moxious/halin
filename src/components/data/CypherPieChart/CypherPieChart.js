import React, { Component } from 'react';
import PieChart from 'react-minimal-pie-chart';
import _ from 'lodash';
import api from '../../../api/';
import datautil from '../../../api/data/util';

import Spinner from '../../ui/scaffold/Spinner/Spinner';

const defaultHeight = 200;
const defaultWidth = 380;

export default class CypherPieChart extends Component {
    state = {
        height: defaultHeight,
        width: defaultWidth,
        data: null,
        total: 1,
        units: '(Units unknown)',
    };

    componentDidMount() {
        this.mounted = true;
        this.sampleData();
        this.interval = setInterval(() => this.sampleData(), this.props.rate || 60 * 1000);
    }

    componentWillUnmount() {
        this.mounted = false;
        this.cancelPoll();
    }

    cancelPoll() {
        if (this.interval) {
            clearTimeout(this.interval);
        }
    }

    sampleData() {
        if (!this.mounted) { return null; }

        return this.props.member.run(this.props.query, this.props.parameters || {})
            .then(results => {
                const values = api.driver.unpackResults(results, {
                    required: ['label', 'value', 'units'],
                });

                const total = values.map(v => v.value).reduce((a, b) => a + b, 0);

                const units = _.uniq(values.map(r => r.units))[0];
                const data = _.sortBy(
                    values.map((rec, idx) => ({
                        title: rec.label + ' (' + this.formatNumberWithUnits(rec.value, units) + ')',
                        value: rec.value,
                        color: api.palette.chooseColor(idx),
                        pct: total > 0 ? rec.value / total : 0,
                    })), 
                    ['value']);

                this.setState({
                    data,
                    error: null,
                    total,
                    units,
                });
            })
            .catch(err => {
                api.sentry.reportError('Error getting pie chart data', err);
                this.setState({
                    error: err,
                    total: 1,
                    data: null,
                });
            });
    }

    formatNumberWithUnits(n, units = this.state.units) {
        return datautil.roundToPlaces(n, 2).toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + units;
    }

    assignLabel = props => {
        const dataItem = props.data[props.dataIndex];
        
        // If it's a very small amount, don't give it a label at all.
        // This prevents a visual traffic jam of labels for lots of small
        // categories.  User can still hover.
        if (dataItem.pct < 0.08) {
            return '';
        }
        return dataItem.title;
    }

    renderPieChart() {
        return (
            <PieChart
                data={this.state.data}
                label={this.assignLabel}
                labelStyle={{
                    fontSize: '5px',
                    fontFamily: 'sans-serif',
                    fill: 'black'
                }}
                radius={42}
                labelPosition={112}
                style={{
                    height: this.state.height,
                    width: this.state.width,
                }}
            />
        );
    }

    render() {
        const tot = this.formatNumberWithUnits(this.state.total);

        return (
            <div className='CypherPieChart'>
                <h5>Total: {tot}</h5>

                {this.state.data ?
                    ((this.state.total && this.state.total > 0) ?
                        this.renderPieChart() : <h5>None/Not Enabled</h5>)
                    : <Spinner active={true} />}
            </div>
        );
    }
};
