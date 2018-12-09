/**
 * This module exists to centralize all uses of the Sentry external dependency, and to
 * provide a central place to do error handling/logging in Halin.
 */
import * as Sentry from '@sentry/browser';
import appPkg from '../../package.json';

let initialized = false;

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

const reportError = (err, message=null) => {
    if (!initialized) { init(); }

    Sentry.captureException(err);
    if (message) {
        console.error(message, err);
    }
    return err;
};

export default {
    init, reportError,
}