import React, { Component } from 'react';
import _ from 'lodash';
import 'semantic-ui-css/semantic.min.css';
import { Grid, Label } from 'semantic-ui-react';
import {
    TimeSeries,
    TimeRange,
    Stream,
} from 'pondjs';
import uuid from 'uuid';
import Spinner from '../ui/Spinner';
import datautil from '../../api/data/util';
import timewindow from '../../api/timeseries/timewindow';
import sentry from '../../api/sentry/index';
import { styler, Charts, Legend, ChartContainer, ChartRow, YAxis, LineChart } from 'react-timeseries-charts';
import NodeLabel from '../ui/NodeLabel';
import './CypherTimeseries.css';

const DEFAULT_PALETTE = [
    '#f68b24', 'steelblue', '#619F3A', '#dfecd7', '#e14594', '#7045af', '#2b3595',
];

/**
 * Repeatedly executes the same cypher query in a loop on a given timeline,
 * and updates a timeseries chart.
 */
class CypherTimeseries extends Component {
    state = {
        startTime: new Date(),
        query: null,
        data: null,
        events: null,
        time: new Date(),
        lastDataArrived: new Date(),
        disabled: {},
        minObservedValue: Infinity,
        maxObservedValue: -Infinity,
        tracker: null,
        timeRange: null,
        metadata: true,
    };

    constructor(props, context) {
        super(props, context);
        this.id = uuid.v4();

        if (!props.query) {
            throw new Error('query is required');
        } else if (!props.displayColumns) {
            throw new Error('displayColumns is required');
        }

        this.query = props.query;
        this.rate = props.rate || 1000;
        this.width = props.width || 800;
        this.min = props.min || (() => this.state.minObservedValue);
        this.max = props.max || (() => this.state.maxObservedValue);
        this.timeWindowWidth = props.timeWindowWidth || 1000 * 60 * 2;  // 2 min
        this.displayColumns = props.displayColumns;
        this.legendOnlyColumns = props.legendOnlyColumns || [];
        this.palette = props.palette || DEFAULT_PALETTE;
        this.showGrid = _.isNil(props.showGrid) ? false : props.showGrid;
        this.showGridPosition = _.isNil(props.showGridPosition) ? 'over' : props.showGridPosition;

        // By default, enable only those specified, otherwise all are on by default.
        this.startingEnabled = props.startingEnabled || props.displayColumns;

        this.dateStyle = {
            fontSize: 12,
            color: "#AAA",
            borderWidth: 1,
            borderColor: "#F4F4F4"
        };
    }
    
    componentDidMount() {
        this.mounted = true;

        this.feed = window.halinContext.getDataFeed({
            node: this.props.node,
            query: this.props.query,
            rate: this.props.rate, 
            windowWidth: this.props.timeWindowWidth,

            // Fetch data for both kinds of columns in the data feed so that
            // the data gets destructured correctly.
            displayColumns: this.props.displayColumns.concat(this.props.legendOnlyColumns || []),
            params: {},
        });

        const onDataListener = (newData, dataFeed) => 
            this.onData(newData, dataFeed);

        this.feed.addListener(onDataListener);

        const disabled = {};

        this.displayColumns.forEach((col, idx) => {
            let disabledFlag;

            if (this.startingEnabled.filter(i => i.accessor === col.accessor).length > 0) {
                disabledFlag = false;
            } else {
                disabledFlag = true;
            }

            disabled[idx] = disabledFlag;
        });

        // Ring buffer captures all of the data that gets displayed. 
        // Can't keep everything, but we need a ring big enough to get as many samples
        // as the time window is wide.  I'm arbitrarily adding 25% just so we don't miss
        // data.

        const curState = this.feed.currentState();

        this.setState({ 
            disabled,
            ...curState,
            startTime: new Date(),
        });

        this.stream = new Stream();
        this.onData(curState, this.feed);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    onData(newData /*, dataFeed */) {
        if (this.mounted) {
            const computedMin = this.feed.min(this.displayColumns) * 0.85;
            const computedMax = this.feed.max(this.displayColumns) * 1.15;

            const maxObservedValue = Math.max(
                this.state.maxObservedValue,
                computedMax
            );

            const minObservedValue = Math.min(
                this.state.minObservedValue,
                computedMin
            );

            const futurePad = 1000; // ms into the future to show blank space on graph
            const fst = this.feed.feedStartTime.getTime();

            let startTime, endTime;

            if ((newData.time.getTime() - fst) >= this.timeWindowWidth) {
                // In this condition, the data feed has historical data to fill the full window.
                // That means our end time should be the present, and our start time should reach back
                // to timeWindowWidth ago.
                startTime = newData.time.getTime() - this.timeWindowWidth;
                endTime = newData.time.getTime() + futurePad;
            } else {
                // We don't have a full time window worth of data.  So to show the most, we start at the feed
                // start time, and end at the time window width.
                startTime = fst;
                endTime = fst + this.timeWindowWidth + futurePad;
            } 

            const timeRange = new TimeRange(startTime, endTime);

            const newState = {
                ...newData,
                maxObservedValue,
                minObservedValue,
                timeRange,
            };

            // if (!this.state.timeRange) {
            //     newState.timeRange = timeRange;
            // }

            if (this.mounted) { this.setState(newState); }
            if(this.props.onUpdate) {
                this.props.onUpdate(newState);   
            }
        } else {
            return null;
        }
    }

    getChartMin() {
        if (!this.mounted) { return 0; }
        let min;

        if (_.isFunction(this.min)) {        
            min = this.min(this.state.data[0]);
        } else {
            min = this.min;
        }

        return min;
    }

    getChartMax() {
        if (!this.mounted) { return 100; } 
        let max;
        if (_.isFunction(this.max)) {
            max = this.max(this.state.data[0]);
        } else {
            max = this.max;
        }

        return max;
    }

    chooseColor(idx) {
        if (_.isNil(idx)) {
            return this.palette[0];
        }

        if (this.state.disabled[idx]) {
            return 'transparent';
        }

        return this.palette[idx % this.palette.length];
    }

    legendClick = data => {
        sentry.debug('Legend clicked',data);

        // Find index and toggle its disabled state.
        let foundIdx;

        this.displayColumns.forEach((item, idx) => {            
            if (item.accessor === data) {
                foundIdx = idx;
            }
        });
        
        const toggle = idx => {
            const disabledNew = _.cloneDeep(this.state.disabled);
            disabledNew[idx] = !this.state.disabled[idx];
            if (this.mounted) { this.setState({ disabled: disabledNew }); }
        };

        toggle(foundIdx);
        // sentry.debug('disabled',this.state.disabled);
    };
    
    handleTimeRangeChange = timeRange => {
        if (!this.mounted) { return; }
        timewindow.setTimeWindow(timeRange);
    };
    
    handleTrackerChanged = (t, scale) => {
        if (this.mounted) {
            this.setState({
                tracker: t,
                trackerEvent: t && this.dataSeries.at(this.dataSeries.bisect(t)),
                trackerX: t && scale(t)
            });
        }
    };

    renderLegendOnlyColumns() {
        if (!this.legendOnlyColumns || this.legendOnlyColumns.length === 0 || !this.state.data) {
            return '';
        }

        return (
            <Grid.Row columns={1}>
                <Grid.Column>
                    {this.legendOnlyColumns.map((col, i)=>
                        <Label key={i}>
                            {col.Header}
                            <Label.Detail>{_.get(this.state.data[0], col.accessor)}</Label.Detail>
                        </Label>
                    )}
                </Grid.Column>
            </Grid.Row>
        );
    }

    // Return the time range that the UI view should show.
    displayTimeRange() {
        return timewindow.displayTimeRange(this.state.timeRange);
    }

    renderChartMetadata() {
        if (!this.state.metadata) { return ''; }
        return (
            <div className='ChartMetadata'>
                { this.props.explainer || '' }

                <Label>
                    Max
                    <Label.Detail>{datautil.roundToPlaces(this.getChartMax(), 2)}</Label.Detail>
                </Label>

                <Label>
                    Min
                    <Label.Detail>{datautil.roundToPlaces(this.getChartMin(), 2)}</Label.Detail>
                </Label>

                <NodeLabel node={this.props.node}/>
            </div>
        );
    }

    render() {
        if (!this.state.events) { return 'Loading...'; }
        const style = styler(this.displayColumns.map((col, idx) => ({
            key: col.accessor, 
            color: this.chooseColor(idx),
            width: 3,
        })));

        this.dataSeries = new TimeSeries({
            name: "Data Series",
            events: this.state.events.toArray(),
        });

        // const tracker = this.state.tracker ? `${this.state.tracker}` : "";
        // const markerStyle = {
        //     backgroundColor: "rgba(255, 255, 255, 0.8)",
        //     color: "#AAA",
        //     marginLeft: "5px"
        // };        

        return (this.state.data && this.mounted) ? (
            <div className="CypherTimeseries">
                <Grid>
                    <Grid.Row columns={1} className='CypherTimeseriesLegend'>
                        <Grid.Column>
                            <Legend type="swatch"
                                style={style}
                                onSelectionChange={this.legendClick}
                                categories={this.displayColumns.map((col, idx) => ({
                                    key: col.accessor,
                                    label: col.Header || col.accessor,
                                    style: { fill: this.chooseColor(idx) },
                                }))}
                            />

                        </Grid.Column>
                        {/* <Grid.Column>
                            <span style={this.dateStyle}>{`${this.state.time}`}</span>
                        </Grid.Column> */}
                    </Grid.Row>
                    {/* <Grid.Row columns={1}>
                        <Grid.Column>
                        {this.state.tracker ? (
                            <div style={{ position: "relative" }}>
                                <div style={{ position: "absolute", left: this.state.trackerX }}>
                                    <div style={markerStyle}>
                                        Data In: {
                                            (this.state.trackerEvent.get("totalMem") || 'foo')
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        </Grid.Column>
                    </Grid.Row> */}
                    <Grid.Row columns={1} className='CypherTimeseriesContent'>
                        <Grid.Column textAlign='left'>
                            <ChartContainer 
                                showGrid={this.showGrid}
                                showGridPosition={this.showGridPosition}
                                width={this.width} 
                                enablePanZoom={true}
                                trackerPosition={this.state.tracker}
                                onTrackerChanged={this.handleTrackerChanged}
                                onTimeRangeChanged={this.handleTimeRangeChange}
                                timeRange={this.displayTimeRange()}>
                                <ChartRow height="150">
                                    <YAxis id="y" 
                                        min={this.getChartMin()} 
                                        max={this.getChartMax()} 
                                        width="70" 
                                        showGrid={true}
                                        type="linear"/>
                                    <Charts>
                                        {
                                            this.displayColumns.map((col, idx) => 
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
                        </Grid.Column>
                    </Grid.Row>
                    { this.renderLegendOnlyColumns() }
                    { this.renderChartMetadata() }                    
                </Grid>
            </div>
        ) : <Spinner active={true}/>;
    }
}

export default CypherTimeseries;