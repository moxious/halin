import React from 'react';
import PropTypes from 'prop-types';

import { Image } from 'semantic-ui-react';
import './Spinner.css';

const style = {
    display:'block', 
    marginLeft:'auto', 
    marginRight: 'auto',
};

/**
 * Simple wrapper for a react loader component,
 * so that we can style it consistenty across components
 */
const Spinner = (props) => {
    return (
        <div className='Spinner'>                
            <Image 
                className='Spinner-logo' 
                style={style} 
                src='img/neo4j_logo_globe.png' 
                size='mini' 
            />
            { props.text }
        </div>
    );
}

Spinner.defaultProps = {
    text: 'Loading',
}

Spinner.props = {
    text: PropTypes.string,
}

export default Spinner;
