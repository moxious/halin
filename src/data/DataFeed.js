import Ring from 'ringjs';
import { TimeEvent } from 'pondjs';
import _ from 'lodash';
const neo4j = require('neo4j-driver/lib/browser/neo4j-web.min.js').v1;

// Fun fact!  Infinity isn't a number, and so Number.isNaN should be true for
// infinity....but it isn't.  https://twitter.com/mdavidallen/status/1047472617115017216
const actualNumber = i => !Number.isNaN(i) && !(i === Infinity) && !(i === -Infinity);

/**
 * DataFeed is an abstraction that polls a cypher query
 * against a driver in a configurable way, and can happen
 * in the background independent of a component being 
 * mounted or not mounted.
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
export default class DataFeed {
    constructor(props) {
        this.node = props.node;
        this.driver = props.driver;
        this.query = props.query;
        this.params = props.params || {};
        this.rate = props.rate || 1000;
        this.displayColumns = props.displayColumns;
        
        // A list of aliases can be passed, allowing renaming of columns.
        this.aliases = props.alias ? [props.alias] : [];

        if (this.aliases.length > 0) {
            console.warn('Warning: use addAliases() rather than passing in DataFeed constructor',
                this.aliases);
        }

        // An augmentation function can be passed to allow computing values that
        // aren't in the query, on the basis of some external function.
        this.augmentFns = props.augmentData ? [props.augmentData] : [];
        this.debug = props.debug;
        this.windowWidth = props.windowWidth || (1000 * 60 * 7);
        this.feedStartTime = null;
        this.lastElapsedMs = -1;

        this.state = {
            data: null,
            events: new Ring(Math.floor((this.windowWidth / this.rate) * 1.25)),
            time: new Date(),
            lastDataArrived: new Date(),
        };

        this.listeners = props.onData ? [props.onData] : [];

        if (!this.node || !this.driver || !this.query || !this.displayColumns) {
            console.error(props);
            throw new Error('Missing one of required props displayColumns, node, driver, query');
        }

        const qtag = this.query.replace(/\s*[\r\n]+\s*/g, ' ');
        this.name = `${this.node.getBoltAddress()}-${qtag}-${JSON.stringify(this.displayColumns)}}`;
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
     * Get the minmum value that occurs in the feed.
     */
    min(cols=this.displayColumns, debug=false) {
        if (!this.state.data || this.state.data.length === 0) { return 0; }

        const timeEvents = this.state.events.toArray();

        // TimeEvent data is structured in a weird way for this computation we want
        // to do so I tacked on an _original field which is nasty, but works.
        const dataPackets = timeEvents.map(te => te._original);

        const minObs = obs => {
            const vals = Object.values(obs).filter(actualNumber);
            return Math.min(...vals);
        };

        const pickFields = cols.map(c => c.accessor);
        const allMins = dataPackets
            .map(obs => _.pick(obs, pickFields))
            .map(obs => minObs(obs));

        return Math.min(...allMins);
    }

    /**
     * Get the maximum value that occurs in the feed.
     * @param cols find the max only considering the provided columns (defaults to all)
     */
    max(cols=this.displayColumns, debug=false) {
        if (!this.state.data || this.state.data.length === 0) { return 1; }
        
        const maxObs = obs => {
            const vals = Object.values(obs).filter(actualNumber);
            return Math.max(...vals);
        };

        const timeEvents = this.state.events.toArray();
        const dataPackets = timeEvents.map(te => te._original);

        const pickFields = cols.map(c => c.accessor);
        const allMaxes = dataPackets
            .map(obs => _.pick(obs, pickFields))
            .map(obs => maxObs(obs));

        return Math.max(...allMaxes);
    }

    /**
     * Take a single sample of data.
     * @returns {Promise} that when resolving calls the onData function and returns
     * its result.
     */
    sampleData() {
        if (!this.feedStartTime) {
            this.feedStartTime = new Date();
        }

        const session = this.driver.session();
        const startTime = new Date().getTime();

        return session.run(this.query, this.params)
            .then(results => {
                this.lastElapsedMs = new Date().getTime() - startTime;

                if (this.lastElapsedMs > this.rate) {
                    // It's a bad idea to run long-running queries with a short window.
                    // It puts too much load on the system and does a bad job updating the
                    // graphic.
                    console.warn(`DataFeed: query took ${this.lastElapsedMs} against window of ${this.rate}`,
                        this.name.slice(0, 150));
                }

                // Take the first result only.  This component only works with single-record queries.
                const rec = results.records[0];
                let data = {};

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
                    if (this.debug) { console.log('AliasObj',aliasObj); }
                    Object.keys(aliasObj).forEach(aliasKey => {
                        if (this.debug) { console.log('Alias',aliasObj[aliasKey],aliasKey); }
                        data[aliasObj[aliasKey]] = data[aliasKey];
                    });
                });

                if (this.debug) {
                    console.log('event', data);
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

                // Let our user know we have something new.
                return this.listeners.map(listener => listener(this.state, this));
            })
            .catch(err => {
                console.error('Failed to execute timeseries query', err);
                if (this.onError) {
                    this.onError(err, this);
                }

                // Back off and schedule next call to be 2x the normal window.
                this.timeout = setTimeout(() => this.sampleData(), this.rate * 2);
            })
            .finally(() => session.close());
    }
}