import React from 'react';
import PropTypes from 'prop-types';

const QueryError = (props = {}) => {
    return (
        <div className='QueryError'>                
            { '' + props.error }
        </div>
    );
}

QueryError.defaultProps = {};

QueryError.props = {
    query: PropTypes.string,
    error: PropTypes.error,
};

export default QueryError;
