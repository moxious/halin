/**
 * This module exists to centralize all uses of the Sentry external dependency, and to
 * provide a central place to do error handling/logging in Halin.
 */
/* eslint-disable no-console */
import * as Sentry from '@sentry/browser';
import appPkg from '../../package.json';
import _ from 'lodash';
import errors from '../driver/errors';

let initialized = false;
let enabled = false;

const init = () => {
    const dsn = 'https://82705ec41177415dbf13621167480fd8@sentry.io/1297023';
    initialized = true;

    return Sentry.init({
        dsn,
        maxBreadcrumbs: 10,
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
// TBD pending further implementation
const shouldSentryCapture = err => {
    const href = _.get(window, 'location.href');
    if (href && href.indexOf('localhost') > -1) {
        return false;
    } else if(errors.isNeo4jError(err)) {
        return false;
    }
    
    return true;
}

const context = ctx => {
    const eventMetadata = {
        neo4j: ctx ? ctx.getVersion() : null,
        clustered: ctx ? ctx.isCluster() : null,
        base: ctx ? ctx.getBaseURI() : null,
    };

    // https://docs.sentry.io/platforms/javascript/#extra-context
    Object.keys(eventMetadata).forEach(key => {
        Sentry.setExtra(key, eventMetadata[key]);
    });
}

const reportError = (err, message=null) => {
    if (!initialized) { init(); }
    if (!enabled) { return null; }

    if (shouldSentryCapture(err)) {
        Sentry.captureException(err);
        if (message) {
            console.error(message, err);
        } 
        return err;
    }

    // console.log('Sentry skipped reporting error');
    return err;
};

const disable = () => {
    enabled = false;
};

export default {
    init, reportError, context,
    info, warn, error, fine, debug,
    disable,
};