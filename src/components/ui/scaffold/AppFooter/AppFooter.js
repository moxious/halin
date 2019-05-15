import React, { Component } from 'react';
import { Divider, Header } from 'semantic-ui-react';

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
            <div className='AppFooter'>               
                <Divider horizontal inverted>
                    <Header as='h4' style={linkStyle}>
                        <a target='halindocs' href='https://neo4j.com/docs/operations-manual/current/'>Operations Manual</a>
                    </Header>                    
                </Divider>
                
                <Divider horizontal inverted>
                    <Header as='h4' style={linkStyle}>
                        <a target='halindocs' href='https://github.com/moxious/halin'>Halin v{appPkg.version}</a>
                    </Header>                    
                </Divider>

                <p style={linkStyle}>
                    Build <a href={`https://circleci.com/gh/moxious/halin/${build.build}`}>{build.build} on {buildDate}</a>
                </p>
            </div>
        );
    }
}