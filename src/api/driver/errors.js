const asStr = err => `${err}`;

export default {
    permissionDenied: err => asStr(err).indexOf('Permission denied') > -1,
    noProcedure: err => asStr(err).indexOf('no procedure with the name') > -1,
    unauthorized: err => asStr(err).toLowerCase().indexOf('unauthorized') > -1,
    failedToEstablishConnection: err => asStr(err).toLowerCase().indexOf('failed to establish connection in') > -1,
    browserSecurityConstraints: err => asStr(err).toLowerCase().indexOf('security constraints in your web browser') > -1,
    noActiveDatabase: err => asStr(err).toLowerCase().indexOf('active database') > -1,
    contains: (err, str) => asStr(err).toLowerCase().indexOf(str.toLowerCase()) > -1,
    insecureWSFromHTTPS: (err, str) => asStr(err).toLowerCase().indexOf('insecure websocket connection may not be initiated from a page loaded over HTTPS') > -1,
};

