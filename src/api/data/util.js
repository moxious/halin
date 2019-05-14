export default {
    /**
     * Turn a number of bytes into a human readable label, like 4KB.
     */
    humanDataSize: (bytes, si) => {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    },

    roundToPlaces: (num, places=2) => 
        Math.round(num * Math.pow(10, places)) / Math.pow(10, places),

    roundPct: num => Math.round(num * 100),

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

