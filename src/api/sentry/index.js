/**
 * This module exists to centralize all uses of the Sentry external dependency, and to
 * provide a central place to do error handling/logging in Halin.
 */
/* eslint-disable no-console */
import * as Sentry from '@sentry/browser';
import appPkg from '../../package.json';

let initialized = false;
let enabled = true;

const init = () => {
    const dsn = 'https://82705ec41177415dbf13621167480fd8@sentry.io/1297023';
    initialized = true;

    return Sentry.init({
        dsn,
        maxBreadcrumbs: 50,
        debug: false,
        release: appPkg.version,
      });    
};

const info = (...args) => enabled ? console.log('INFO', ...args) : null;
const warn = (...args) => enabled ? console.error('WARN', ...args) : null;
const error = (...args) => enabled ? console.error('ERROR', ...args) : null;
const fine = (...args) => enabled ? console.log('FINE', ...args) : null;
const debug = (...args) => enabled ? console.log('DEBUG', ...args) : null;

// Filter out certain messages which might be so common that they'd create problems.
const shouldSentryCapture = err => {
    const str = `${err}`;

    if (str.indexOf('WebSocket connection failure') > -1) {
        return false;
    }

    return true;
}

const reportError = (err, message=null) => {
    if (!initialized) { init(); }
    if (!enabled) { return null; }

    if (shouldSentryCapture(err)) {
        Sentry.captureException(err);
        if (message) {
            console.error(message, err);
        }    
    }

    return err;
};

const disable = () => {
    enabled = false;
};

export default {
    init, reportError,
    info, warn, error, fine, debug,
    disable,
};