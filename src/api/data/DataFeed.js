import Ring from 'ringjs';
import { TimeEvent, TimeRange } from 'pondjs';
import _ from 'lodash';
import queryLibrary from './queries/query-library';
import sentry from '../sentry/index';
import Metric from '../Metric';
import neo4j from '../driver';
import math from 'mathjs';

const actualNumber = i => !_.isNaN(i) && !(i === Infinity) && !(i === -Infinity);

/**
 * DataFeed is an abstraction that polls a cypher query
 * against a ClusterMember in a configurable way, and can happen
 * in the background independent of a component being 
 * mounted or not mounted.  It accumulates data in a sliding window through time.
 * 
 * DataFeed relies a lot on pond.js v0.8.*, docs here: https://esnet-pondjs.appspot.com/#/
 * 
 * Data feeds must have a query, and must have a set of displayColumns of the form
 * [ { Header: 'foo', accessor: 'bar' }, ... ].
 * 
 * This indicates that the 'bar' field is coming back from the cypher query.
 * 
 * DataFeeds may have "augmentationFunctions".  Every time new data is received from the
 * feed, the augmentation functions are run. In this way you can add computed values that
 * aren't present in the output with any javascript.
 * 
 * DataFeeds may have "aliases".  This permits dynamically renaming columns from a cypher
 * output to some other column name.  For example, to separate the same "freeMem" field
 * amongst a set of 4 different results from cluster members.
 * 
 * DataFeeds may be started and stopped, and can have multiple listeners who get notified
 * when new data is available.
 */
export default class DataFeed extends Metric {
    constructor(props) {
        super();
        this.node = props.node;
        this.query = props.query;
        this.params = props.params || {};
        this.rate = props.rate || 1000;
        this.displayColumns = props.displayColumns || props.columns;
        
        // A list of aliases can be passed, allowing renaming of columns.
        this.aliases = props.alias ? [props.alias] : [];

        if (this.aliases.length > 0) {
            sentry.warn('Warning: use addAliases() rather than passing in DataFeed constructor',
                this.aliases);
        }

        // An augmentation function can be passed to allow computing values that
        // aren't in the query, on the basis of some external function.
        this.augmentFns = props.augmentData ? [props.augmentData] : [];
        this.debug = props.debug;
        this.windowWidth = props.windowWidth || (1000 * 60 * 7);
        this.feedStartTime = null;

        this.label = this.findLabel(this.query);

        this.state = {
            data: null,
            events: new Ring(Math.floor((this.windowWidth / this.rate) * 1.25)),
            time: new Date(),
            lastDataArrived: new Date(),
        };

        this.listeners = props.onData ? [props.onData] : [];

        if (!this.node || !this.query || !this.displayColumns) {
            sentry.error(props);
            throw new Error('Missing one of required props displayColumns/columns, node, query');
        }

        const qtag = this.query.replace(/\s*[\r\n]+\s*/g, ' ');
        this.name = `${this.node.getBoltAddress()}-${qtag}-${JSON.stringify(this.displayColumns)}}`;
    }

    findLabel(query) {
        let bestLabel = null;

        Object.keys(queryLibrary).forEach(queryType => {
            if (queryLibrary[queryType].query === query) {
                bestLabel = queryType;
            }
        });

        return bestLabel || 'Unlabeled';
    }

    /**
     * @returns {Object} the last/current fetched data state of the feed.
     */
    currentState() {
        return this.state;
    }

    addAugmentationFunction(fn) {
        if (this.augmentFns.indexOf(fn) === -1) {
            this.augmentFns.push(fn);
        }

        return this.augmentFns;
    }

    removeAugmentationFunction(fn) {
        const idx = this.augmentFns.indexOf(fn);
        if (idx > -1) {
            this.augmentFns.splice(idx, 1);
        }
        return this.augmentFns;
    }

    addAliases(aliases) {
        if (this.aliases.indexOf(aliases) === -1) {
            this.aliases.push(aliases);
        }
        return this.aliases;
    }

    addListener(listener) {
        if (this.listeners.indexOf(listener) === -1) {
            this.listeners.push(listener);
        }

        return this.listeners;
    }

    removeListener(listener) {
        const idx = this.listeners.indexOf(listener);
        if (idx > -1) {
            this.listeners.splice(idx, 1);
        }

        return this.listeners;
    }

    /**
     * Stop the feed.  It will no longer poll.
     */
    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.feedStartTime = null;
        }
    }

    /**
     * Start the feed.  If the feed is already running, this stops/restarts it.
     */
    start() {
        this.stop();
        return this.sampleData();
    }

    /**
     * Return true if the feed is running, false otherwise.
     */
    isRunning() {
        return this.feedStartTime !== null;
    }

    /**
     * Remember that DataFeeds are sliding windows, they don't accumulate data forever.  This sliding
     * window is (this.windowWidth) milliseconds wide *at maximum*.
     * @returns {TimeRange} corresponding to the moments of the first and last data points observed.
     */
    getTimeRange() {
        const timeEvents = this.state.events.toArray();
        const first = timeEvents[0];
        const last = timeEvents[timeEvents.length - 1];

        if (first && last) {
            return new TimeRange(first.timestamp(), last.timestamp());
        }

        return null;
    }

    getDataPackets() {
        // TimeEvent data is structured in a weird way for this computation we want
        // to do so I tacked on an _original field which is nasty, but works.
        const timeEvents = this.state.events.toArray();
        return timeEvents.map(te => te._original);
    }

    /**
     * Summarize statistics about what's running and how well it's going.
     */
    stats() {
        const packets = this.getDataPackets();
        
        const sampleTimes = packets.map(p => p._sampleTime);
        const timings = _.isEmpty(sampleTimes) ? [0] : sampleTimes;

        return {
            name: this.name,
            label: this.label,
            address: this.node.getBoltAddress(),
            lastObservation: this.state && this.state.data ? this.state.data[0] : null,
            query: this.query,
            packets: packets.length,
            stdev: math.std(...timings),
            mean: math.mean(...timings),
            median: math.median(...timings),
            mode: math.mode(...timings),
            min: math.min(...timings),
            max: math.max(...timings),
            listeners: this.listeners.length,
            augFns: this.augmentFns.length,
            aliases: this.aliases.length,
            timings,
        };
    }

    /**
     * Get the minmum value that occurs in the feed.
     */
    min(cols=this.displayColumns) {
        if (!this.state.data || this.state.data.length === 0) { return 0; }

        const minObs = obs => {
            const vals = _.values(obs).filter(actualNumber);
            return Math.min(...vals);
        };

        const pickFields = cols.map(c => c.accessor);
        const allMins = this.getDataPackets()
            .map(obs => _.pick(obs, pickFields))
            .map(obs => minObs(obs));

        return Math.min(...allMins);
    }

    /**
     * Get the maximum value that occurs in the feed.
     * @param cols find the max only considering the provided columns (defaults to all)
     */
    max(cols=this.displayColumns) {
        if (!this.state.data || this.state.data.length === 0) { return 1; }
        
        const maxObs = obs => {
            const vals = _.values(obs).filter(actualNumber);
            return Math.max(...vals);
        };

        const pickFields = cols.map(c => c.accessor);
        const allMaxes = this.getDataPackets()
            .map(obs => _.pick(obs, pickFields))
            .map(obs => maxObs(obs));

        return Math.max(...allMaxes);
    }

    isFresh() {
        // this.sampleStart is when we last asked for data.
        // this.state.lastDataArrived is when we last got some.
        const lastAskedForData = (this.sampleStart || new Date()).getTime();
        const lastReceivedData = this.state.lastDataArrived.getTime();
        const now = new Date().getTime();
        
        // Encountered errors mean we aren't fresh.
        if (this.state.error) {
            return false;
        }

        // How much time has gone by since we asked for data?
        let elapsed = 0;
        if (lastReceivedData >= lastAskedForData) {
            // Haven't started polling yet for next go-around.
            // So do it on the basis of last request experience.
            elapsed = lastReceivedData - lastAskedForData;
        } else {
            // We have a pending request out.
            elapsed = now - lastAskedForData;
        }

        // How long/extra we'll wait before we're not fresh.
        const freshnessThreshold = this.windowWidth * 2;
        if (elapsed > freshnessThreshold) {
            return false;
        }

        return true;
    }

    /**
     * Take a single sample of data.
     * @returns {Promise} that when resolving calls the onData function and returns
     * its result.
     */
    sampleData() {
        let firstRun = false;
        if (!this.feedStartTime) {
            this.feedStartTime = new Date();
            firstRun = true;
        }

        const startTime = new Date().getTime();
        this.sampleStart = new Date();

        return this.node.run(this.query, this.params)
            .then(results => {
                const elapsedMs = new Date().getTime() - startTime;

                if (elapsedMs > (2 * this.rate) && !firstRun) {
                    // It's a bad idea to run long-running queries with a short window.
                    // It puts too much load on the system and does a bad job updating the
                    // graphic.
                    sentry.warn(`DataFeed: query took ${elapsedMs} against window of ${this.rate}`,
                        this.name.slice(0, 200));
                }

                // Take the first result only.  This component only works with single-record queries.
                const rec = results.records[0];
                if (!rec) {
                    throw new Error(`Query ${this.query} returned no valid records`);
                }

                // Record elapsed time for every sample
                let data = { _sampleTime: elapsedMs };

                // Plug query data values into data map, converting ints as necessary.
                this.displayColumns.forEach(col => {
                    const val = rec.get(col.accessor);
                    data[col.accessor] = neo4j.isInt(val) ? neo4j.integer.toNumber(val) : val;
                });

                // Progressively merge data from the augmentation functions, if
                // present.
                this.augmentFns.forEach(fn => {
                    data = _.merge(data, fn(data));
                });

                // Apply aliases if specified.
                this.aliases.forEach(aliasObj => {
                    if (this.debug) { sentry.fine('AliasObj',aliasObj); }
                    Object.keys(aliasObj).forEach(aliasKey => {
                        if (this.debug) { sentry.fine('Alias',aliasObj[aliasKey],aliasKey); }
                        data[aliasObj[aliasKey]] = data[aliasKey];
                    });
                });

                if (this.debug) {
                    sentry.fine('event', data);
                }
                this.timeout = setTimeout(() => this.sampleData(), this.rate);

                const t = new Date();
                const event = new TimeEvent(t, data);
                
                // Tack on the extra field so that other computations can
                // access the data in the original format.
                event._original = data;

                const newEvents = this.state.events;
                newEvents.push(event);
                this.state.lastDataArrived = new Date();
                this.state.data = [data];
                this.state.time = t;
                this.state.event = newEvents;
                this.state.error = undefined;

                // Let our user know we have something new.
                return this.listeners.map(listener => listener(this.state, this));
            })
            .catch(err => {
                sentry.reportError(err, 'Failed to execute timeseries query');
                
                this.state.lastDataArrived = this.feedStartTime;
                this.state.error = err;

                if (this.onError) {
                    this.onError(err, this);
                }

                // Back off and schedule next call to be 2x the normal window.
                this.timeout = setTimeout(() => this.sampleData(), this.rate * 2);
            });
    }
}