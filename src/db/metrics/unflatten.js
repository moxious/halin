const _set = require('lodash').set;
const _setWith = require('lodash').setWith;
/**
 * @id unflatten
 * @function unflatten
 * Opposite of `flatten-obj`. Unflattens an object with delimited keys
 * @param  {object} subject - Object that needs to be unflattened
 * @param  {object|string|boolean} [opts] - Optional.
 * - Provide a string as a shortcut for `{ separator: opts }`
 * - Provide a boolean as a shorcut for `{ objectMode: opts }`
 * - Provide an object to set both options `{ separator: '/', objectMode: true }`
 * - Available options:
 *   + **separator** (*string*) - defaults to `'.'`
 *   + **objectMode** (*boolean*) - defaults to `false`
 * @return {object} obj - Nested Javascript object
 */
function unflatten(obj, opts) {
    var separator = '.'
    var objectMode = false
    if (typeof opts === 'string') {
        separator = opts
    } else if (typeof opts === 'boolean') {
        objectMode = opts
    } else if (opts) {
        separator = opts.separator || separator
        objectMode = opts.objectMode
    }
    const dotSep = (separator === '.')
    var re = new RegExp(separator, 'g')
    var newObj = {}
    for (let path in obj) {
        if (objectMode) {
            _setWith(newObj, dotSep ? path : path.replace(re, '.'), obj[path], Object)
        } else {
            _set(newObj, dotSep ? path : path.replace(re, '.'), obj[path])
        }
    }
    return newObj
}

module.exports = unflatten;