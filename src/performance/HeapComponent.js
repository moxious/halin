import React, { Component } from "react";
import "semantic-ui-css/semantic.min.css";
import { Grid } from 'semantic-ui-react';
import * as PropTypes from "prop-types";
import {
    TimeSeries,
    TimeRange,
    TimeEvent,
    Pipeline as pipeline,
    Stream,
    EventOut,
    avg
} from "pondjs";

import { styler, Charts, BarChart, Legend, Resizable, ChartContainer, ChartRow, YAxis, LineChart } from "react-timeseries-charts";
import Ring from "ringjs";

const neo4j = require("neo4j-driver/lib/browser/neo4j-web.min.js").v1;

const sec = 1000;
const minute = 60 * sec;
const hours = 60 * minute;

// How frequently (ms) the chart updates
const rate = 1000;

// How wide of a time interval the chart shows.
const timeWindowWidth = 5 * minute;

// Aggregation of averages
const windowBy = '1m';

const query = `
    CALL dbms.queryJmx('java.lang:type=Memory') yield attributes 
    WITH 
        attributes.HeapMemoryUsage as heap, 
        attributes.NonHeapMemoryUsage as nonHeap

    WITH 
        heap.value.properties as heapProps,
        nonHeap.value.properties as nonHeapProps
    
    return 
        heapProps.init as heapInit, 
        heapProps.committed as heapCommitted,
        heapProps.used as heapUsed, 
        heapProps.max as heapMax,
        nonHeapProps.init as nonHeapInit,
        nonHeapProps.committed as nonHeapCommitted,
        nonHeapProps.used as nonHeapUsed,
        nonHeapProps.max as nonHeapMax
`;

/*
const cpuLoadQuery = `
    CALL dbms.queryJmx('java.lang:type=OperatingSystem') 
    YIELD attributes 
    WITH 
        attributes.SystemLoadAverage as SystemLoad, 
        attributes.ProcessCpuLoad as ProcessLoad 
    RETURN 
        SystemLoad.value as systemLoad, 
        ProcessLoad.value as processLoad;
`;
*/

class HeapComponent extends Component {
    state = {
        time: new Date(),
        events: new Ring(200),
        avg: new Ring(100),
        initMem: 0,
        maxMem: 16 * 1024 * 1024 * 1024,
        tracker: null,
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
        this.timeout = null;
    }

    sampleHeap() {
        if (!this.mounted) { 
            return false;
        }

        const session = this.driver.session();
        
        return session.run(query, {})
            .then(res => {
                
                const rec = res.records[0];
                const [heapInit, heapCommitted, heapUsed, heapMax, 
                    nonHeapInit, nonHeapCommitted, nonHeapUsed, nonHeapMax] = 
                    [
                        neo4j.integer.toNumber(rec.get('heapInit')),
                        neo4j.integer.toNumber(rec.get('heapCommitted')),
                        neo4j.integer.toNumber(rec.get('heapUsed')), 
                        neo4j.integer.toNumber(rec.get('heapMax')),
                        neo4j.integer.toNumber(rec.get('nonHeapInit')),
                        neo4j.integer.toNumber(rec.get('nonHeapCommitted')),
                        neo4j.integer.toNumber(rec.get('nonHeapUsed')), 
                        neo4j.integer.toNumber(rec.get('nonHeapMax')),
                    ];

                // Race condition; update component and reschedule only if
                // we're still mounted, as this code can fire after the user
                // has left this component.
                if (this.mounted) {
                    const totalUsed = (heapUsed + nonHeapUsed);
                    const totalMax = (nonHeapMax > 0 ? nonHeapMax : 0) + heapMax;

                    this.setState({ 
                        heapInit, heapMax, heapUsed, heapCommitted,
                        nonHeapInit, nonHeapMax, nonHeapCommitted, nonHeapUsed,
                        totalUsed, totalMax,
                    });
                    
                    const increment = minute;
                    const t = new Date();//this.state.time.getTime() + increment);

                    const event = new TimeEvent(t, {
                        heapUsed,
                        nonHeapUsed,
                        totalUsed,
                    });
        
                    // Raw events
                    const newEvents = this.state.events;
                    newEvents.push(event);
                    this.setState({ time: t, events: newEvents });
        
                    // Let our aggregators process the event
                    this.stream.addEvent(event);
        
                    // Set next call to occur.
                    this.timeout = setTimeout(() => this.sampleHeap(), rate);
                }
            })
            .catch(err => {
                console.error('Failed to sample heap', err);
                // Slow down next call
                setTimeout(() => this.sampleHeap(), rate * 5);
            })
            .finally(() => session.close);
    }

    componentDidMount() {
        //
        // Setup our aggregation pipelines
        //
        this.stream = new Stream();

        pipeline()
            .from(this.stream)
            .windowBy(windowBy)
            .emitOn("discard")
            .aggregate({
                value: { heapUsed: avg() }
            })
            .to(EventOut, event => {
                const events = this.state.avg;
                events.push(event);
                this.setState({ avg: events });
            });

        this.mounted = true;
        this.sampleHeap();
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    render() {
        const latestTime = `${this.state.time}`;

        const fiveMinuteStyle = {
            value: {
                normal: { fill: "#619F3A", opacity: 0.2 },
                highlight: { fill: "619F3A", opacity: 0.5 },
                selected: { fill: "619F3A", opacity: 0.5 }
            }
        };

        //
        // Create a TimeSeries for our raw, 5min and hourly events
        //

        const memoryUsageSeries = new TimeSeries({
            name: "Heap Used",
            events: this.state.events.toArray(),
        });

        const avgSeries = new TimeSeries({
            name: `Average (${windowBy})`,
            events: this.state.avg.toArray()
        });

        let beginTime = new Date(this.state.time.getTime() - (timeWindowWidth)); 
        const endTime = new Date(this.state.time.getTime() + (5 * sec));
        const timeRange = new TimeRange(beginTime, endTime);

        const style = styler([
            { key: "avg", color: "#DFECD7", width: 2 },
            {key: "heapUsed", color: "steelblue", width: 2 },
            // {key: "nonHeapUsed", color: "#F68B24", width: 2 },
            {key: "totalUsed", color: "#F68B24", width: 2 },
        ]);

        const dateStyle = {
            fontSize: 12,
            color: "#AAA",
            borderWidth: 1,
            borderColor: "#F4F4F4"
        };

        return (            
            <div className="HeapComponent">
                <Grid divided='vertically'>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <Legend
                                type="swatch"
                                style={style}
                                categories={[
                                    {
                                        key: "totalUsed",
                                        label: "Total Memory Used",
                                        style: { fill: "#000000" },
                                    },
                                    {
                                        key: "avg",
                                        label: `Average (${windowBy})`,
                                        style: { fill: "#DFECD7" }
                                    },
                                    {
                                        key: 'heapUsed',
                                        label: 'Heap Memory',
                                        style: { fill: '#ff0000' },
                                    },
                                    // {
                                    //     key: 'nonHeapUsed',
                                    //     label: 'Non-Heap Memory',
                                    //     style: { fill: '#ff0000' },
                                    // },
                                ]}
                            />
                        </Grid.Column>
                        <Grid.Column>
                            <span style={dateStyle}>{latestTime}</span>
                        </Grid.Column>
                    </Grid.Row>
                    
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Resizable>
                                <ChartContainer 
                                    showGrid={true}
                                    trackerPosition={this.state.tracker}
                                    onTrackerChanged={t => this.handleTrackerChanged(t)}
                                    timeRange={timeRange}>
                                    <ChartRow height="200">
                                        <YAxis
                                            id="y"
                                            label="Heap Used"
                                            min={0}
                                            max={this.state.totalMax}
                                            width="70"
                                            type="linear"
                                        />
                                        <Charts>
                                            <BarChart
                                                axis="y"
                                                series={avgSeries}
                                                style={fiveMinuteStyle}
                                                columns={["value"]}
                                            />
                                            <LineChart 
                                                axis="y" 
                                                columns={["heapUsed"]} 
                                                style={style}
                                                series={memoryUsageSeries}  />
                                            {/* <LineChart 
                                                axis="y"
                                                style={style}
                                                columns={["nonHeapUsed"]} 
                                                series={memoryUsageSeries} /> */}
                                            <LineChart 
                                                axis="y"
                                                style={style}
                                                columns={["totalUsed"]} 
                                                series={memoryUsageSeries} />
                                        </Charts>
                                    </ChartRow>
                                </ChartContainer>
                            </Resizable>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }

    handleTrackerChanged(t) {
        // console.log('Tracker: ',t);
        this.setState({ tracker: t });
    }
}

HeapComponent.contextTypes = {
    driver: PropTypes.object
};

export default HeapComponent;