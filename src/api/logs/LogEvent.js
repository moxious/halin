import _ from 'lodash';
import moment from 'moment';

class LogEvent {
    constructor(props) {
        // Copy props into this.
        _.merge(this, props);

        // Date format: 2019-03-20 12:34:51.201+0000
        // Convert timestamp to something useful.
        this.timestamp = moment.utc(this.timestamp);        
    }
}

// Example: 2019-03-20 12:34:48.039+0000 INFO 
const lineDesignator = new RegExp('^([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\\.[^ ]+) ([^ ]+) ');

const parseLines = lines => {
    const events = [];
    let curEvent = null;
    let accumulator = [];

    const finishEntry = (idx=-1) => {
        if (curEvent && accumulator.length > 0) {
            // Keep data as an array of lines, sometimes that matters.
            curEvent.data = accumulator;
            curEvent.text = accumulator.join('\n');
            accumulator = [];
            events.push(curEvent);
        } else if (idx !== 0) {
            console.warn('Finishing entry with no accumulated data on line ', idx);
        }
    }

    // Check each line for a log entry header.  If it has one start a new entry.
    // If it doesn't, push the line onto a data accumulator.
    lines.forEach((line, idx) => {
        const match = line.match(lineDesignator);

        if (match) {
            // Append left-overs of last.
            finishEntry(idx);

            const timestamp = match[1];
            const logLevel = match[2];

            let logData = line.replace(lineDesignator, '');
            let classDesignator = '';

            // Example: [o.n.i.d.DiagnosticsManager] 
            const classDesignatorRE = new RegExp('^(\\[[^\\]]+\\]) ');

            const cd = logData.match(classDesignatorRE);
            if (cd) {
                classDesignator = cd[1].replace('[', '').replace(']', '');
                logData = logData.replace(classDesignatorRE, '');
            }

            // console.log('New curEvent', timestamp, logLevel, classDesignator);
            curEvent = new LogEvent({
                timestamp, logLevel, classDesignator
            });
            accumulator = [logData];
        } else {
            accumulator.push(line);
        }
    });

    finishEntry();
    return events;
};

const parseData = data => parseLines(data.split(/[\n\r]+/));

export default {
    parseData,
    parseLines,
    LogEvent,
};