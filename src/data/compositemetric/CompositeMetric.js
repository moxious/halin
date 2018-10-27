import Metric from '../Metric';

/**
 * A composite metric is one that needs more than one data feed to source
 * its metric.  Several data feeds are combined, some calculation is done
 * on them, and a new metric results.
 * 
 * This is intended to be an abstract class.
 */
export default class CompositeMetric extends Metric {
    constructor(dataFeeds) {
        this.dataFeeds = dataFeeds;
    }

    isFresh() {
        // The composite metric is fresh if all of its underlying feeds
        // are fresh.
        return this.dataFeeds
            .map(df => df.isFresh())
            .reduce((a, b) => a && b, true);
    }

    currentState() {
        return this.state;
    }
}