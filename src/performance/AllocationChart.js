import React, { Component } from 'react';
import { PieChart } from 'react-d3-components';
import d3 from 'd3';
import './AllocationChart.css';
import datautil from '../data/util';
import Spinner from '../Spinner';

const defaultHeight = 200;
const defaultWidth = 400;

export default class AllocationChart extends Component {
    state = {
        allocPct: 0,
        freePct: 1,
        total: 100,
        free: 100,
        alloc: 0,
        height: defaultHeight,
        width: defaultWidth,
        sort: null,
        populated: false,
    };

    componentWillReceiveProps(props) {
        // Take the free and total the user gave us and compute 
        // percentages, fill in the gaps.
        const newState = {
            populated: true,
            valid: true,
            free: props.free,
            total: props.total,
            freePct: (props.free / props.total),
            allocPct: 1 - (props.free / props.total),
            alloc: (props.total - props.free),
            pieWidth: props.pieWidth || defaultWidth,
            pieHeight: props.pieHeight || defaultHeight,
        };

        this.setState(newState);
    }

    tooltip = (label, value) => {
        let underlyingValue = 0;
        if (label.match(/alloc/i)) {
            underlyingValue = this.state.alloc;
        } else {
            underlyingValue = this.state.free;
        }

        if (this.props.dataMeasurement) {
            underlyingValue = datautil.humanDataSize(underlyingValue, true);
        }

        return label + ' (' + underlyingValue + ')';
    }

    makeData() {
        return {
            label: this.props.label || 'Generic',

            values: [
                { x: `Allocated: ${datautil.roundPct(this.state.allocPct)}%`, y: this.state.allocPct * 100 },
                { x: `Free: ${datautil.roundPct(this.state.freePct)}%`, y: this.state.freePct * 100 },
            ],
        };
    }

    render() {
        const tot = this.props.dataMeasurement ? datautil.humanDataSize(this.state.total, true) : this.state.total;

        return (
            <div className='AllocationChart'>
                <h5>Total: {tot}</h5>
                { this.state.populated ? 
                    ((this.state.total && this.state.total > 0) ? 
                    <PieChart
                        data={this.makeData()}
                        tooltipHtml={this.tooltip}
                        width={this.state.width}
                        height={this.state.height}
                        colorScale={d3.scale.category20()}
                        margin={{top: 10, bottom: 10, left: 100, right: 100}}
                        sort={this.state.sort}
                    /> : <h5>None/Not Enabled</h5>)
                : <Spinner active={true} /> }
            </div>
        )
    }
}