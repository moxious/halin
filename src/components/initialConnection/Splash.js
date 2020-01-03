import React from "react";
import { Image } from 'semantic-ui-react';

const style = {
    div: {
        display: 'block', 
        width: 320, 
        marginLeft: 'auto', 
        marginRight: 'auto',
    },
    image: {
        display: 'inline'
    },
};

const Splash = (props) => {
    return (
        <div className='Splash' style={style.div}>
            <Image 
                alt='Halin Monitoring'
                className='SplashHalin' 
                src='img/halin-icon.png' 
                style={style.image}
                size='small'/>
            <Image 
                alt='Neo4j Graph Database'
                className='SplashNeo4j' 
                src='img/neo4j_logo_globe.png' 
                style={style.image}
                size='small'/>
        </div>
    );
}

export default Splash;
