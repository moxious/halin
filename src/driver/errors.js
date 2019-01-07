const asStr = err => `${err}`;

export default {
    permissionDenied = err => asStr(err).indexOf('Permission denied') > -1,
    noProcedure = err => asStr(err).indexOf('no procedure with the name') > -1,
};

