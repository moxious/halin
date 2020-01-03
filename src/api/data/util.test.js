import util from './util';

const MB = 1024 * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

describe('Data Formatting Utilities', function() {
    it('should human format data correctly', () => {
        expect(util.humanDataSize(9)).toEqual('9 B');
        expect(util.humanDataSize(MB), true).toEqual('1.0 MB');
        expect(util.humanDataSize(MB), true).toEqual('1.0 MB');
        expect(util.humanDataSize(3 * TB)).toEqual('3.0 TB');
        expect(util.humanDataSize(1.1 * GB)).toEqual('1.1 GB');
    });

    it('can round to places', () => {
        expect(util.roundToPlaces('3.141592', 2)).toEqual(3.14);
        expect(util.roundToPlaces(2,4)).toEqual(2.0000);
    });

    it('can turn time abbreviations into milliseconds', () => {
        expect(util.timeAbbreviation2Milliseconds('5s')).toEqual(5000);
        expect(util.timeAbbreviation2Milliseconds('5ms')).toEqual(5);
        expect(util.timeAbbreviation2Milliseconds('10m')).toEqual(10 * 60 * 1000);
        
        // It should return its input when it is confused.
        expect(util.timeAbbreviation2Milliseconds('FISH')).toEqual('FISH');
    });

    it('can calculate signal strength', () => {
        expect(util.signalStrengthFromPing(0)).toEqual(100);
        expect(util.signalStrengthFromPing(500)).toEqual(25);
        expect(util.signalStrengthFromPing(212)).toEqual(50);
    });
});