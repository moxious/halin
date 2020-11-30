import sentry from "../sentry";

export default {
    /**
     * Turn a number of bytes into a human readable label, like 4KB.
     */
    humanDataSize: (bytesInput) => {
        let bytes = bytesInput;
        var thresh = 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    },

    /**
     * This takes numbers like 9876543 and turns them into things like "9.87 million"
     */
    humanNumberSize: num => {
        let here = num;
        const thresh = 1000;

        if (Math.abs(here) < thresh) {
            return here;
        }

        const units = ['K', 'million', 'billion', 'trillion'];

        var u = -1;
        do {
            here /= thresh;
            ++u;
        } while(Math.abs(here) >= thresh && u < units.length -1);
        
        const res = here.toFixed(2) + ' ' + units[u];
        return res;
    },

    roundToPlaces: (num, places=2) => 
        Math.round(num * Math.pow(10, places)) / Math.pow(10, places),

    roundPct: num => Math.round(num * 100),

    signalStrengthFromFreshRatio: (fresh, total) => {
        const ratio = fresh / Math.max(total, 1);
        return ratio * 100;
    },

    timeAbbreviation2Milliseconds: abbrev => {
        if (!abbrev) { return 0; }

        if (abbrev.endsWith('ms')) {
            return abbrev.slice(0, abbrev.length - 2) * 1;
        } else if(abbrev.endsWith('s')) {
            return abbrev.slice(0, abbrev.length - 1) * 1000;
        } else if(abbrev.endsWith('m')) {
            return abbrev.slice(0, abbrev.length - 1) * 1000 * 60;
        }

        sentry.warn(`Unrecognized time suffix ${abbrev}`);
        return abbrev;
    },

    /**
     * Given a ping time in ms, return a strength rating (0-100).
     * These are somewhat arbitrary, based on experience with remote databases
     * on cloud setups.
     * @param {Number} ms the number of milliseconds to respond to a ping.
     * @param {Error} if specified, the strength will be zero.
     * @returns {Number} from 0-100 for signal strength.
     */
    signalStrengthFromPing: (ms, err) => {
        if (err) {
            return 0;
        }

        if (ms >= 300) {
            return 25;
        }

        if (ms >= 200) {
            return 50;
        }

        if (ms > 100) {
            return 75;
        }

        return 100;
    },
};

