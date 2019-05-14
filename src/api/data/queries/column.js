/**
 * Convenience functions for dealing with columns expected back from Cypher queries.
 */
import _ from 'lodash';

const column = data => {
    let col;

    if (typeof data === 'string') {
        col = { accessor: data };
    } else {
        col = _.cloneDeep(data);
    }

    if (!col.Header) {
        col.Header = col.accessor.charAt(0).toUpperCase() + col.accessor.slice(1)
    }

    // The Cell function is what react-table and other plugins use
    col.renderWith = f => _.set(col, 'Cell', f);

    return col;
};

 export default column;