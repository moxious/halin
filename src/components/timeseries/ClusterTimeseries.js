import React, { Component } from 'react';
import _ from 'lodash';
import { Grid, Label } from 'semantic-ui-react';
import {
    TimeSeries,
    TimeRange,
    Stream,
} from 'pondjs';
import uuid from 'uuid';
import neo4j from '../../api/driver';
import palette from '../../api/palette';
import datautil from '../../api/data/util';
import timewindow from '../../api/timeseries/timewindow';
import queryLibrary from '../../api/data/queries/query-library';
import sentry from '../../api/sentry/index';

import Spinner from '../ui/scaffold/Spinner/Spinner';

import { styler, Charts, Legend, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart } from 'react-timeseries-charts';
import './CypherTimeseries.css';

const LEADER_COLOR = '#000000';

/**
 * Repeatedly executes the same cypher query in a loop on a given timeline,
 * and updates a timeseries chart, against an entire cluster.
 */
class ClusterTimeseries extends Component {
    state = {
        chartLowLimit: Infinity,
        chartHighLimit: -Infinity,
        startTime: new Date(),
        query: null,
        data: null,
        events: null,
        time: new Date(),
        lastDataArrived: new Date(),
        minObservedValue: Infinity,
        maxObservedValue: -Infinity,
        tracker: null,
        timeRange: null,
        disabled: {},
        metadata: false,
        displayProperty: null,
    };

    constructor(props, context) {
        super(props, context);
        this.id = uuid.v4();

        if (!props.query && !props.feedMaker) {
            throw new Error('Either query OR feedmaker is a required property');
        } else if (!props.displayProperty) {
            throw new Error('displayProperty is required');
        }

        this.state.displayProperty = props.displayProperty;
        this.query = props.query;
        this.rate = props.rate || 2000;
        this.width = props.width || 380;
        this.timeWindowWidth = props.timeWindowWidth || 1000 * 60 * 5;  // 5 min
        this.showGrid = _.isNil(props.showGrid) ? false : props.showGrid;
        this.showGridPosition = _.isNil(props.showGridPosition) ? 'over' : props.showGridPosition;
        this.feedMaker = props.feedMaker;
        this.onUpdate = props.onUpdate;

        this.dateStyle = {
            fontSize: 12,
            color: "#AAA",
            borderWidth: 1,
            borderColor: "#F4F4F4"
        };

        this.nodes = window.halinContext.members().map(node => node.getBoltAddress());
    }

    /**
     * Timeseries uses specialized keys that let it find the right observation in a series of 
     * strings.  In general we key data by the bolt address of the host that it came from in 
     * a cluster feed.  But there are some formatting restrictions.  So across components this
     * is a standard method of determining the data key for a given bolt address.
     */
    static keyFor(addr, field) {
        if (!addr || !field) {
            throw new Error('Must provide both addr and field');
        }

        return `${addr}-${field}`.replace(/[^a-zA-Z0-9]/g, '');        
    }

    /**
     * @param {*} query the text of a cypher query
     * @returns {HalinQuery} from the query library whose query matches
     */
    findMatchingHalinQuery(query=this.props.query) {
        let queryObj = null;

        Object.keys(queryLibrary).forEach(entry => {
            if (!queryLibrary[entry].query || queryObj) { return; }

            if (queryLibrary[entry].query === query) {
                queryObj = queryLibrary[entry];
            }
        });

        return queryObj;
    }

    /**
     * Check and see if query is a standard query.  If so, retrieve its columns.
     */
    findColumns(query=this.props.query) {
        const queryObj = this.findMatchingHalinQuery(query);
        const columns = queryObj ? queryObj.columns : null;

        // If columns cannot be found, just use the display property.
        return columns ? columns : [
            { Header: this.state.displayProperty, accessor: this.state.displayProperty },
        ];
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.database !== this.state.database) {
            // Switching databases probably requires we adjust which feeds we're pulling from.
            this.startDataFeeds();
        }

        this.setState({ 
            displayProperty: props.displayProperty,
            database: props.database,
            // Reset observed values to reset y axis
            minObservedValue: Infinity,
            maxObservedValue: -Infinity,
            
            // On next incremental, reset the vertical axis.
            resetY: true,
        });
    }

    handleTimeRangeChange = timeRange => {
        if (!this.mounted) { return; }
        timewindow.setTimeWindow(timeRange);
        this.setState({ timeRange });
    };
    
    handleTrackerChanged = (t, scale) => {
        this.setState({
            tracker: t,
            trackerEvent: t && this.dataSeries.at(this.dataSeries[this.nodes[0]].bisect(t)),
            trackerX: t && scale(t)
        });
    };

    // Return the time range that the UI view should show.
    displayTimeRange() {
        return timewindow.displayTimeRange(_.get(_.get(this.state, this.nodes[0]), 'timeRange'));
    }

    startDataFeeds() {
        const halin = window.halinContext;
        const chooseDatabaseLabel = () => {
            if (this.props.database) {
                return this.props.database.getLabel();
            }

            const defaultDatabase = halin.getDatabaseSet().getDefaultDatabase();

            if (!defaultDatabase) {
                sentry.warn('No default database detected in ClusterTimeseries');
                return 'DEFAULT';
            }

            return defaultDatabase.getLabel();
        };

        halin.members().forEach(node => {
            const addr = node.getBoltAddress();

            this.streams[addr] = new Stream();

            let feed;

            // If the user specified a feed making function, use that one.
            // Otherwise construct the reasonable default.
            if (this.props.feedMaker) {
                if (this.props.debug) { console.log('FEEDMAKER'); }
                feed = this.props.feedMaker(node);
            } else {
                const queryObj = this.findMatchingHalinQuery(this.props.query);
                if (this.props.debug) { 
                    console.log('Matching query', queryObj);
                }
                feed = halin.getDataFeed({
                    node,
                    database: chooseDatabaseLabel(),
                    query: this.props.query,
                    rate: this.props.rate,
                    windowWidth: this.props.timeWindowWidth,
                    displayColumns: this.findColumns(),
                    filter: queryObj ? queryObj.filter : null,
                });

                feed.addAliases({ [this.state.displayProperty]: ClusterTimeseries.keyFor(addr, this.state.displayProperty) });
            }

            if (this.feeds[addr]) {
                // We're doing a property switch, and we're replacing a previous data feed.
                // This requires that we unregister the previous hooks we had in place, so
                // that the component doesn't get confused with double updates.
                console.log('removing old data listener');
                this.feeds[addr].removeListener('data', this.onDataCallbacks[addr]);
            }

            this.feeds[addr] = feed;

            // Define a closure which makes the data callback specific to this node.
            this.onDataCallbacks[addr] = (newData, dataFeed) =>
                this.onData(node, chooseDatabaseLabel(), newData, dataFeed);

            // And attach that to the feed.
            this.feeds[addr].on('data', this.onDataCallbacks[addr]);

            const curState = this.feeds[addr].currentState();
            this.onDataCallbacks[addr](curState, this.feeds[addr]);
        });
    }

    componentDidMount() {
        this.mounted = true;

        this.feeds = {};
        this.streams = {};
        this.onDataCallbacks = {};

        this.startDataFeeds();

        const noneDisabled = {};
        this.nodes.forEach(addr => {
            noneDisabled[ClusterTimeseries.keyFor(addr, this.state.displayProperty)] = false;
        });

        this.setState({
            startTime: new Date(),
            disabled: noneDisabled,
        });
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    onData(clusterMember, database, newData, dataFeed) {
        const addr = clusterMember.getBoltAddress();

        if (!this.mounted) { return; }

        // Minimum computed only on the basis of our single display property.
        // The data packet may have other stuff in it, in different data ranges.  We don't
        // want max/min of that, because it isn't displayed.
        const cols = [{ accessor: this.state.displayProperty, Header: this.state.displayProperty }];

        const computedMin = dataFeed.min(cols, this.props.debug) * 0.85;
        const computedMax = dataFeed.max(cols, this.props.debug) * 1.15;

        if (this.props.debug) {
            // console.log('MEMBER',clusterMember,'DB',database,'DATA',_.get(newData,'data[0]'));
            sentry.debug('computedMin/Max',computedMin,computedMax,'from',this.state.displayProperty);
        }

        const maxObservedValue = computedMax; /*Math.max(
            (this.resetY ? -Infinity : this.state.maxObservedValue),
            computedMax
        );*/

        const minObservedValue = computedMin; /*Math.min(
            (this.resetY ? Infinity : this.state.minObservedValue),
            computedMin
        );*/

        const futurePad = 1000; // ms into the future to show blank space on graph

        if (!dataFeed.feedStartTime) {
            sentry.fine('ClusterTimeseries:  feed is stopped');
            return null;
        }

        const fst = dataFeed.feedStartTime.getTime();

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

        // Each address has unique data state.
        const stateAddendum = {};
        stateAddendum[addr] = newState;
        // if (this.props.debug) {
        //     sentry.debug('ClusterTimeseries state update', 
        //         stateAddendum, 'min=', computedMin, 'max=',computedMax);
        // }

        this.setState(stateAddendum);
        if (this.onUpdate) {
            this.onUpdate(this.state);
        }
    }

    getObservedMins() {
        return this.nodes.map(addr => this.state[addr].minObservedValue);
    }

    getObservedMaxes() {
        return this.nodes.map(addr => this.state[addr].maxObservedValue);
    }

    getChartMin() {
        if (!_.isNil(this.props.min)) { return this.props.min; } 

        const allMins = this.getObservedMins();
        return Math.min(Math.min(...allMins), this.state.chartLowLimit);
    }

    getChartMax() {
        if (!_.isNil(this.props.max)) { return this.props.max; }

        const allMaxes = this.getObservedMaxes();
        // return Math.max(Math.max(...allMaxes), this.state.chartHighLimit);
        return Math.max(...allMaxes);
    }

    chooseColor(idx) {
        if (_.isNil(idx)) {
            return palette.chooseColor(0);
        }

        const addr = this.nodes[idx];
        const key = ClusterTimeseries.keyFor(addr, this.state.displayProperty);

        if (this.state.disabled[key]) {
            return 'transparent';
        }

        const member = window.halinContext.members()[idx];
        if (member.isLeader() && !member.supportsMultiDatabase()) {
            return LEADER_COLOR;
        } else if(member.supportsMultiDatabase() && member.canWrite(neo4j.SYSTEM_DB)) {
            return LEADER_COLOR;
        }

        return palette.chooseColor(idx);
    }

    legendClick = data => {
        sentry.fine('Legend clicked', data);

        const toggle = key => {
            const disabledNew = _.cloneDeep(this.state.disabled);
            disabledNew[key] = !this.state.disabled[key];
            this.setState({ disabled: disabledNew });
        };

        toggle(data);
    };

    toggleMetadata = () => {
        const metadata = !this.state.metadata;
        this.setState({ metadata });
    };

    handleTimeRangeChange = timeRange => {
        if (!this.mounted) { return; }
        timewindow.setTimeWindow(timeRange);
    };

    handleTrackerChanged = (t, scale) => {
        this.setState({
            tracker: t,
            trackerEvent: t && this.dataSeries[this.nodes[0]].at(this.dataSeries[this.nodes[0]].bisect(t)),
            trackerX: t && scale(t)
        });
    };

    renderChartMetadata() {
        if (!this.state.metadata) { return ''; }
        const obsMin = Math.min(...this.getObservedMins());
        const obsMax = Math.max(...this.getObservedMaxes());
        return (
            <div className='ChartMetadata'>
                <Label>
                    Max
                    <Label.Detail>{
                        datautil.roundToPlaces(obsMax, 2)
                    }</Label.Detail>
                </Label>

                <Label>
                    Min
                    <Label.Detail>{
                        datautil.roundToPlaces(obsMin, 2)
                    }</Label.Detail>
                </Label>

                <Label>
                    Range
                    <Label.Detail>{datautil.roundToPlaces(obsMax-obsMin,2)}</Label.Detail>
                </Label>
            </div>
        );
    }

    render() {
        const style = styler(this.nodes.map((addr, idx) => ({
            key: ClusterTimeseries.keyFor(addr, this.state.displayProperty),
            color: this.chooseColor(idx),
            width: this.props.chartType === 'scatter' ? 8 : 3,
        })));

        this.dataSeries = {};

        // We have data if none of the data fields in our state are missing.
        const hasData = this.nodes
            .map(addr => _.get(this.state[addr], 'data'))
            .reduce((accumulator, curVal) => accumulator && curVal, true);

        if (hasData) {
            this.nodes.forEach(addr => {
                this.dataSeries[addr] = new TimeSeries({
                    name: 'Data Series',
                    events: this.state[addr].events.toArray()
                });
            });
        }

        if (!this.mounted || !hasData) {
            return <Spinner active={true} />;
        }

        // For both the yAxis and the container, define some defaults, permitting overrides to be
        // passed in via props.
        const yAxisProps = _.merge({
            id: 'y',
            width: 70,
            showGrid: true,
            type: 'linear',
            min: this.getChartMin(),
            max: this.getChartMax(),
        }, this.props.yAxis || {});

        const containerProps = _.merge({
            showGrid: this.showGrid,
            showGridPosition: this.showGridPosition,
            width: this.width,
            enablePanZoom: true,
            trackerPosition: this.state.tracker,
            onTrackerChanged: this.handleTrackerChanged,
            onTimeRangeChanged: this.handleTimeRangeChange,
            timeRange: this.displayTimeRange()
        }, this.props.container || {});

        return (
            <div className="CypherTimeseries">
                <Grid>
                    <Grid.Row columns={1} className='CypherTimeseriesLegend'>
                        <Grid.Column>
                            <Legend type="swatch"
                                style={style}
                                onSelectionChange={this.legendClick}
                                categories={this.nodes.map((addr, idx) => ({
                                    key: ClusterTimeseries.keyFor(addr, this.state.displayProperty),
                                    label: window.halinContext.members()[idx].getLabel(),
                                    style: { 
                                        fill: this.chooseColor(idx),
                                    },
                                }))}
                            />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1} className='CypherTimeseriesContent'>
                        <Grid.Column textAlign='left'>
                            <ChartContainer {...containerProps}>
                                <ChartRow height="150">
                                    <YAxis {...yAxisProps} />
                                    <Charts>
                                        {
                                            this.nodes.map((addr /* , idx */) => {
                                                const chartProps = {
                                                    key: ClusterTimeseries.keyFor(addr, this.state.displayProperty),
                                                    axis: 'y',
                                                    style,
                                                    columns: [ClusterTimeseries.keyFor(addr, this.state.displayProperty)],
                                                    series: this.dataSeries[addr]
                                                };

                                                if (this.props.chartType === 'scatter') {
                                                    return <ScatterChart {...chartProps} />;
                                                }
                                                return <LineChart {...chartProps} />
                                            })
                                        }
                                    </Charts>
                                </ChartRow>
                            </ChartContainer>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

                { this.renderChartMetadata() }
            </div>
        );
    }
}

export default ClusterTimeseries;