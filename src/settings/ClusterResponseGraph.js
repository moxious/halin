import React, { Component } from 'react';
import { ScatterPlot } from 'react-d3-components';

export default class ClusterResponseGraph extends Component {
    state = {
        dataSeries: null,
    };

    getData() {
        if (!this.mounted) { return null; } 
        const ctx = window.halinContext;

        const dataSeries = ctx.members().map(node => ({
            label: node.getLabel(),
            values: node.getObservations().toArray(),
        }));

        this.setState({
            dataSeries,
        });
    }

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.getData(), 750);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    render() {
        const tooltipScatter = (x, y, rest) => {
            return `${x}: ${y}ms`;
        };

        return (
            <div className='ClusterResponseGraph'>{ this.state.dataSeries ? 
                <ScatterPlot 
                    data={this.state.dataSeries}
                    width={600}
                    height={300}
                    margin={{top: 10, bottom: 50, left: 50, right: 10}}
                    tooltipHtml={tooltipScatter}
                    xAxis={{label: "Time"}}
                    yAxis={{label: "Response time (ms)"}}/>
                : '' }
            </div>
        );
    }
}