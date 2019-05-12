import LogEvent from './LogEvent';

describe('Log Events', function() {
    const cls = 'o.n.g.f.m.e.CommunityEditionModule';
    const log = 'INFO';

    it('can parse multiple log lines into a single entry', () => {
        const lines = [
            `2019-04-23 19:16:27.905+0000 ${log} [${cls}] Something`,
            'something',
            'something',

            `2019-04-23 19:16:27.905+0000 ${log} [${cls}] blah`,
            'blah',
        ];

        const events = LogEvent.parseLines(lines);

        expect(events.length).toEqual(2);
        expect(events[0].classDesignator).toEqual(cls);
        expect(events[0].logLevel).toEqual(log);

        expect(events[1].classDesignator).toEqual(cls);
        expect(events[1].logLevel).toEqual(log);
    });

});