import React, { Component } from 'react';
import { Image } from 'semantic-ui-react';
import './Spinner.css';

/**
 * Simple wrapper for a react loader component,
 * so that we can style it consistenty across components
 */
export default class Spinner extends Component {
    render() {
        return (
            <div className='Spinner'>                
                <Image 
                    className='Spinner-logo' 
                    style={{
                        display:'block', 
                        marginLeft:'auto', 
                        marginRight: 'auto',
                    }} 
                    src='img/neo4j_logo_globe.png' 
                    size='mini' 
                />
                { this.props.text || 'Loading' }
            </div>
        )
    }
}