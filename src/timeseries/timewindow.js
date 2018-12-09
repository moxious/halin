import sentry from '../sentry/index';

/**
 * This file is a miniature mix-in for timeseries components.  It allows storing a global user-selected
 * time window for examination, and encapsulates figuring out what time window to display based on 
 * the sliding window of a data feed, and what the user selected.
 */
const windowProps = {
    timeRange: null,
};

const setTimeWindow = window => {
    windowProps.timeRange = window;
    return window;
};

const getTimeWindow = () => windowProps.timeRange;

/**
 * 
 * @param {*} scrollingRange the scrolling window time range that the data feed has.
 */
const displayTimeRange = (scrollingRange) => {
    // What the user chose.
    const userSelectedRange = windowProps.timeRange;

    // Simple case.
    if (!userSelectedRange) {
        return scrollingRange;
    }

    // Complex case: if the user asked to see a range that doesn't overlap at all with the data
    // that we have, then reset what they asked.
    if (userSelectedRange && scrollingRange && userSelectedRange.disjoint(scrollingRange)) {
        sentry.debug('User selected range ', 
            userSelectedRange, 
            'does not overlap with scrolling range',
            scrollingRange, '...resetting');
        setTimeWindow(null);
    } else if(userSelectedRange.begin() >= new Date()) {
        // In this case, the user is scrolled into the future that the time window hasn't filled yet.
        // For example, say you start your data feed at t1.  It lasts t1 - t5.  User selects t3 - t6.
        // They're overlapping, which should be ok, but if the range's start point is after now, there
        // can be no data and hence the selection is invalid.
        sentry.debug('User selected range is in the un-displayable future');
        setTimeWindow(null);
    }

    // You get the scrolling range by default if either you didn't select a timerange, or 
    // what you chose doesn't display any data.
    return userSelectedRange;
};

export default {
    displayTimeRange, setTimeWindow, getTimeWindow,
};