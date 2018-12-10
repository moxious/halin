import React, { Component } from "react";
import { Image } from 'semantic-ui-react';

const style = {
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
};

export default class Splash extends Component {
    render() {        
        return (
            <div className='Splash' style={{display: 'block', width: 320, marginLeft: 'auto', marginRight: 'auto'}}>
                <Image 
                    alt='Halin Monitoring'
                    className='SplashHalin' 
                    src='img/halin-icon.png' 
                    style={{display:'inline'}}
                    size='small'/>
                <Image 
                    alt='Neo4j Graph Database'
                    className='SplashNeo4j' 
                    src='img/neo4j_logo_globe.png' 
                    style={{display:'inline'}}
                    size='small'/>
            </div>
        )
    }
};
