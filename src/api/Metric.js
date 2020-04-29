import sentry from './sentry';

/**
 * A metric is a high level class that represents a measurable attribute
 * of a Neo4 instance.
 */
export default class Metric {
    constructor() {
        this._subscribers = {
            'data': [],
            'error': [],
        };
    }

    on(event, f) {
        if (!this._subscribers[event]) {
            this._subscribers[event] = [];
        }

        this._subscribers[event].push(f);
        return f;
    }

    _notifyListeners(event, args) {
        const list = this._subscribers[event] || [];

            list.forEach(f => {
                try {
                    f(...args);
                } catch (e) {
                    sentry.reportError(`Error in ${event} listener: `, e);
                }
            });
    }

    removeListener(event, f) {
        const list = this._subscribers[event] || [];
        const idx = list.indexOf(f);

        if (idx > -1) {
            list.splice(idx, 1);
            this._subscribers[event] = list;
        }

        return f;
    }

    currentState() {
        throw new Error('Override me');
    }

    isFresh() {
        throw new Error('Override me');
    }
}