import React, { Component } from 'react';
import { PieChart } from 'react-d3-components';
import _ from 'lodash';
import d3 from 'd3';
import api from '../../../api/';
import datautil from '../../../api/data/util';

import Spinner from '../../ui/scaffold/Spinner/Spinner';

const defaultHeight = 200;
const defaultWidth = 400;

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

                const data = {
                    label: this.props.title || 'CypherPieChart',

                    // Modify from label/value to x/y according to what
                    // piechart needs
                    values: values.map(rec => ({
                        x: rec.label,
                        y: rec.value,
                    })),
                };

                const units = _.uniq(values.map(r => r.units))[0];

                console.log('Found data', data);
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

    formatNumberWithUnits(n) {
        return datautil.roundToPlaces(n, 2).toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + this.state.units;
    }

    tooltip = (label, value) => {
        // let underlyingValue = 0;
        return label + ' (' + this.formatNumberWithUnits(value) + ')';
    };

    render() {
        const tot = this.formatNumberWithUnits(this.state.total);

        return (
        <div className='CypherPieChart'>
            <h3>{this.props.label}</h3>
            
            <h5>Total: {tot}</h5>
            
            {this.state.data ?
                ((this.state.total && this.state.total > 0) ?
                    <PieChart
                        data={this.state.data}
                        tooltipHtml={this.tooltip}
                        width={this.state.width}
                        height={this.state.height}
                        colorScale={d3.scale.category20()}
                        margin={{ top: 10, bottom: 10, left: 100, right: 100 }}
                        sort={this.state.sort}
                    /> : <h5>None/Not Enabled</h5>)
                : <Spinner active={true} />}
        </div>
        );
    }
};
