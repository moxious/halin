import _ from 'lodash';

/**
 * Object that represents the result of a rule looking at a diagnostic package.
 */
export default class Advice {
    /**
     * Create an inspection result.
     * @param level how serious the result is
     * @param finding text describing what the issue is
     * @param evidence (optional) data showing the issue
     * @param advice (optional) corrective action if applicable.
     */
    constructor({ level, addr=Advice.CLUSTER, database='all', finding, evidence=null, advice='none' }) {
        this.addr = addr;
        this.level = level;
        this.finding = finding;
        this.evidence = evidence;
        this.advice = advice;
        this.database = database;

        if (!level || !addr || !finding) {
            throw new Error('Advice requires at a minimum a level, addr, and finding');
        }

        if ((level === Advice.ERROR || level === Advice.WARN) && !advice) {
            throw new Error('Errors and warnings must always come with advice.');
        }
    }

    static makeLevel(level, props) {
        if (props.level) {
            throw new Error('MakeLevel passed a level, which would be overridden');
        }
        return new Advice(_.merge({ level }, props));
    }

    static pass(props) { return Advice.makeLevel(Advice.PASS, props); }
    static error(props) { return Advice.makeLevel(Advice.ERROR, props); }
    static warn(props) { return Advice.makeLevel(Advice.WARN, props); }
    static info(props) { return Advice.makeLevel(Advice.INFO, props); }
};

Advice.CLUSTER = 'overall';
Advice.WARN = 'warning';
Advice.PASS = 'pass';
Advice.ERROR = 'error';
Advice.INFO = 'info';
Advice.validLevels = new Set(
    Advice.WARN,
    Advice.PASS,
    Advice.ERROR,
    Advice.INFO
);