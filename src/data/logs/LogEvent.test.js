import LogEvent from './LogEvent';
import moment from 'moment';

describe('Log Events', function() {
    const cls = 'o.n.g.f.m.e.CommunityEditionModule';
    const log = 'INFO';
    const date1 = '2019-04-23 19:16:27.905+0000';
    const date2 = '2019-04-25 19:16:27.905+0000';

    it('can parse multiple log lines into a single entry', () => {
        const lines = [
            `${date1} ${log} [${cls}] Something`,
            'something',
            'something',

            `${date2} ${log} [${cls}] blah`,
            'blah',
        ];

        const events = LogEvent.parseLines(lines);

        expect(events.length).toEqual(2);
        expect(events[0].classDesignator).toEqual(cls);
        expect(events[0].logLevel).toEqual(log);
        expect(moment.utc(date1).diff(events[0].timestamp)).toEqual(0);

        expect(events[1].classDesignator).toEqual(cls);
        expect(events[1].logLevel).toEqual(log);
        expect(moment.utc(date2).diff(events[1].timestamp)).toEqual(0);
    });

});