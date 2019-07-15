import configureAuthLockoutTime from './configureAuthLockoutTime';
import configureMaxFailedAttempts from './configureMaxFailedAttempts';
import dontRetainBrowserCredentials from './dontRetainBrowserCredentials';
import enableAuth from './enableAuth';
import recommendDisableHTTP from './recommendDisableHTTP';
import recommendNoExternalJMX from './recommendNoExternalJMX';
import requireTLSForBolt from './requireTLSforBolt';
import useLDAP from './useLDAP';

export default [
    dontRetainBrowserCredentials,
    recommendDisableHTTP,
    recommendNoExternalJMX,
    configureAuthLockoutTime,
    enableAuth,
    configureMaxFailedAttempts,
    requireTLSForBolt,
    useLDAP,
];