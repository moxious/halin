import React, { Component } from 'react';
import PieChart from 'react-minimal-pie-chart';
import './AllocationChart.css';
import datautil from '../../../api/data/util';
import Spinner from '../../ui/scaffold/Spinner/Spinner';
import api from '../../../api';

const defaultHeight = 200;
const defaultWidth = 380;

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

    // Deprecated because the d3 pie chart seems to have CSS
    // bugs that display the tooltip in a remote position relative to the chart
    tooltip = (label /*, value */) => {
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
        return [
            {
                title: `Allocated: ${datautil.roundPct(this.state.allocPct)}%`,
                value: this.state.allocPct * 100,
                color: api.palette.chooseColor(0, api.palette.TWO_TONE),
            },
            {
                title: `Free: ${datautil.roundPct(this.state.freePct)}%`,
                value: this.state.freePct * 100,
                color: api.palette.chooseColor(1, api.palette.TWO_TONE),
            },
        ];
    }

    renderPieChart() {
        const assignLabel = props => {
            const dataItem = props.data[props.dataIndex];
            return dataItem.title;
        };

        return (
            <PieChart 
                data={this.makeData()}
                label={assignLabel}
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
        const tot = this.props.dataMeasurement ? datautil.humanDataSize(this.state.total, true) : this.state.total;

        return (
            <div className='AllocationChart'>
                <h5>{this.props.label} Total: {tot}</h5>
                {this.state.populated ?
                    ((this.state.total && this.state.total > 0) ?
                        this.renderPieChart() : <h5>None/Not Enabled</h5>)
                    : <Spinner active={true} />}
            </div>
        )
    }
}