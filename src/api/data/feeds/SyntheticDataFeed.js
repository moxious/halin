import Ring from 'ringjs';
import Metric from '../../Metric';
import sentry from '../../sentry';

const RING_SIZE = 100;

/**
 * A Synthetic Data Feed is one that combines other Data Feeds and produces a new
 * kind of computed metric, on the basis of data coming from the server, but which 
 * itself did not come from the server.
 */
export default class SyntheticDataFeed extends Metric {
    initialize(dataFeeds, ringSize=RING_SIZE) {
        this.dataFeeds = dataFeeds;
        this.ringSize = ringSize;
        this.feedStartTime = null;
        this.listeners = [];
        this.start();
    }

    start() {
        if (!this.feedStartTime) {
            this.feedStartTime = new Date();
        }

        this.subordinateFeedListeners = {};
        this.accumulator = {};

        // Accumulate data as it comes in from all of the referred data feeds.
        this.dataFeeds.map(df => {
            const name = df.name;

            const listenerFn = (state, dataFeed) => {
                const name = dataFeed.name;
                this.accumulator[name].push(state.current);
                this.onUpdate();
            };

            this.accumulator[name] = new Ring(this.ringSize);
            this.subordinateFeedListeners[name] = listenerFn;
            df.addListener(listenerFn);
        });
    }

    /**
     * Called whenever any of the constituent feeds updates us with data.
     */
    onUpdate() {
        sentry.fine('Synthetic Data Feed subclass should override me');
    }

    stop() {
        this.feedStartTime = null;

        return this.dataFeeds.map(df => {
            const name = df.name;
            const listenerFn = this.subordinateFeedListeners[name];
            df.removeListener(listenerFn);
        });
    }

    notifyListeners() {
        return this.listeners.map(listener => listener(this.state, this));
    }

    isFresh() {
        // The synthetic data feed is fresh if all feeds that are input are fresh.
        return this.dataFeeds.map(df => df.isFresh()).reduce((a, b) => a && b, true);
    }

    isRunning() {
        return this.feedStartTime !== null;
    }

    currentState() {
        throw new Error('Override me in a specific SyntheticDataFeed');
    }

    isFresh() {
        return true;
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
}