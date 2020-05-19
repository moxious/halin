const asStr = err => `${err}`;

const matches = (substr) => (err) => asStr(err).toLowerCase().indexOf(substr.toLowerCase()) > -1;
const contains = (err, str) => asStr(err).toLowerCase().indexOf(str.toLowerCase()) > -1;

const permissionDenied = matches('permission denied');
const noProcedure = matches('no procedure with the name');
const unauthorized = matches('unauthorized');
const bookmarks = matches('Supplied bookmark');
const failedToEstablishConnection = matches('failed to establish connection in');
const browserSecurityConstraints = matches('security constraints in your web browser');
const noActiveDatabase = matches('active database');
const insecureWSFromHTTPS = matches('insecure websocket connection may not be initiated from a page loaded over HTTPS');
const repeatedAuthFailure = matches('incorrect authentication details too many times in a row');
const fileNotFound = matches('java.io.FileNotFoundException');
const connectionRefused = matches('ERR_CONNECTION_REFUSED');
const apocFileImportNotEnabled = matches('apoc.import.file.enabled');
const notUpToRequestedVersion = matches('database not up to requested version');

const isNeo4jError = err =>
    failedToEstablishConnection(err) || browserSecurityConstraints(err) ||
    permissionDenied(err) || noProcedure(err) ||
    unauthorized(err) || bookmarks(err) ||
    noActiveDatabase(err) || insecureWSFromHTTPS(err) ||
    repeatedAuthFailure(err) || fileNotFound(err) ||
    connectionRefused(err) || notUpToRequestedVersion(err);

const isAPOCError = err => apocFileImportNotEnabled(err);
    
export default {
    isNeo4jError,
    isAPOCError,
    matches,
    permissionDenied,
    noProcedure,
    unauthorized,
    bookmarks,
    failedToEstablishConnection,
    browserSecurityConstraints,
    noActiveDatabase,
    contains,
    insecureWSFromHTTPS,
    repeatedAuthFailure,
    fileNotFound,
    connectionRefused,
    apocFileImportNotEnabled,
    notUpToRequestedVersion,
};
