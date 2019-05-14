import timewindow from './timewindow';
import { TimeRange } from 'pondjs';
import moment from 'moment';

describe('Time Windows', function () {
    const startTime = moment("2019-01-01T12:00:00").toDate();
    const endTime = moment("2019-01-01T12:05:00").toDate();
    let range;

    beforeEach(() => {
        range = new TimeRange(startTime, endTime);
    })


    it('should have a coordinated time window shared among all components', () =>
        expect(typeof timewindow.getTimeWindow()).toBe('object'));
    
    it('should allow mutation of that timewindow', () => {
        timewindow.setTimeWindow(range);
        expect(timewindow.getTimeWindow()).toEqual(range);
    });

    it('eliminates the time window when the ranges are disjoint', () => {
        const disjointStart = moment("2019-02-01T12:00:00").toDate();
        const disjointEnd = moment("2019-02-01T12:05:00").toDate();
        const disjoint = new TimeRange(disjointStart, disjointEnd);

        timewindow.setTimeWindow(range);
        timewindow.displayTimeRange(disjoint);
        expect(timewindow.getTimeWindow()).toEqual(null);
    });

    it('eliminates the time window when the user selected range is in the future', () => {
        const futureStart = moment().add(1, 'year').toDate();
        const futureEnd = moment().add(1, 'year').add(5, 'minutes').toDate();
        const future = new TimeRange(futureStart, futureEnd);

        timewindow.setTimeWindow(range);
        timewindow.displayTimeRange(future);
        expect(timewindow.getTimeWindow()).toEqual(null);
    });

    it('returns the selected range when the scrolling range does overlap', () => {
        const startTime2 = moment("2019-01-01T12:01:00").toDate();
        const endTime2 = moment("2019-01-01T12:06:00").toDate();

        timewindow.setTimeWindow(range);
        const scrollingRange = new TimeRange(startTime2, endTime2);
        expect(timewindow.displayTimeRange(scrollingRange)).toEqual(range);
    });
});