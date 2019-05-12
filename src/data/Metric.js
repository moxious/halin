/**
 * A metric is a high level class that represents a measurable attribute
 * of a Neo4 instance.
 */
export default class Metric {
    currentState() {
        throw new Error('Override me');
    }

    isFresh() {
        throw new Error('Override me');
    }
}