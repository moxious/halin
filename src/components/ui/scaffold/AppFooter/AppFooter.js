import React, { Component } from 'react';
import { Divider, Icon, Header, Segment } from 'semantic-ui-react';

import appPkg from '../../../../package.json';
import build from '../../../../build.json';
import moment from 'moment';

import './AppFooter.css';

const linkStyle = {
    color: 'white',
    fontSize: '10px',
};

export default class AppFooter extends Component {
    render() {
        console.log('build',build);
        const buildDate = moment.utc(build.date).format("YYYY-MM-DD");
        return (
            <div className='AppFooter' style={{float:'bottom'}}>               
                <Divider horizontal inverted>
                    <Header as='h4' style={linkStyle}>
                        <a target='halin' href='https://neo4j.com/docs/operations-manual/current/'>Operations Manual</a>
                    </Header>                    
                </Divider>
                
                <Divider horizontal inverted>
                    <Header as='h4' style={linkStyle}>
                        <a target='halin' href='https://github.com/moxious/halin'>Halin v{appPkg.version}</a>
                    </Header>                    
                </Divider>

                <p style={linkStyle}>
                    Build {build.build}<br/>{buildDate}
                </p>
            </div>
        );
    }
}