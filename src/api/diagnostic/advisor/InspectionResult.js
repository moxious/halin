/**
 * Object that represents the result of a rule looking at a diagnostic package.
 */
export default class InspectionResult {
    /**
     * Create an inspection result.
     * @param level how serious the result is
     * @param finding text describing what the issue is
     * @param evidence (optional) data showing the issue
     * @param advice (optional) corrective action if applicable.
     */
    constructor(level, addr, finding, evidence=null, advice='none') {
        this.addr = addr;
        this.level = level;
        this.finding = finding;
        this.evidence = evidence;
        this.advice = advice;
    }

    isError() { return this.level === InspectionResult.ERROR; }
    isPass() { return this.level === InspectionResult.PASS; }
    isWarning() { return this.level === InspectionResult.WARN; }
    isInfo() { return this.level === InspectionResult.INFO; }
};

InspectionResult.WARN = 'warning';
InspectionResult.PASS = 'pass';
InspectionResult.ERROR = 'error';
InspectionResult.INFO = 'info';
InspectionResult.validLevels = new Set(
    InspectionResult.WARN,
    InspectionResult.PASS,
    InspectionResult.ERROR,
    InspectionResult.INFO
);