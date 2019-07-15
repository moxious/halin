import configureAuthLockoutTime from './configureAuthLockoutTime';
import configureMaxFailedAttempts from './configureMaxFailedAttempts';
import configureCORSHeaders from './configureCORSHeaders';
import dontRetainBrowserCredentials from './dontRetainBrowserCredentials';
import enableAuth from './enableAuth';
import implementBrowserTimeout from './implementBrowserTimeout';
import recommendDisableHTTP from './recommendDisableHTTP';
import recommendNoExternalJMX from './recommendNoExternalJMX';
import requireTLSForBolt from './requireTLSforBolt';
import setHSTSResponseHeader from './setHSTSResponseHeader';
import useLDAP from './useLDAP';

export default [
    dontRetainBrowserCredentials,
    recommendDisableHTTP,
    recommendNoExternalJMX,
    configureAuthLockoutTime,
    configureCORSHeaders,
    enableAuth,
    implementBrowserTimeout,
    configureMaxFailedAttempts,
    requireTLSForBolt,
    setHSTSResponseHeader,
    useLDAP,
];