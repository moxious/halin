const asStr = err => `${err}`;

const matches = (substr) => (err) => asStr(err).toLowerCase().indexOf(substr.toLowerCase()) > -1;

export default {
    matches,
    permissionDenied: matches('permission denied'),
    noProcedure: matches('no procedure with the name'),
    unauthorized: matches('unauthorized'),
    failedToEstablishConnection: matches('failed to establish connection in'),
    browserSecurityConstraints: matches('security constraints in your web browser'),
    noActiveDatabase: matches('active database'),
    contains: (err, str) => asStr(err).toLowerCase().indexOf(str.toLowerCase()) > -1,
    insecureWSFromHTTPS: matches('insecure websocket connection may not be initiated from a page loaded over HTTPS'),
    repeatedAuthFailure: matches('incorrect authentication details too many times in a row'),
    fileNotFound: matches('java.io.FileNotFoundException'),
    connectionRefused: matches('ERR_CONNECTION_REFUSED'),
    apocFileImportNotEnabled: matches('apoc.import.file.enabled'),
    notUpToRequestedVersion: matches('database not up to requested version'),
};

