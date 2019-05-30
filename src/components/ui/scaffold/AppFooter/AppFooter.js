import React, { Component } from 'react';
import { List, Image } from 'semantic-ui-react';
import api from '../../../../api/';
import appPkg from '../../../../package.json';
import build from '../../../../build.json';
import moment from 'moment';

import './AppFooter.css';

import HalinCard from '../../scaffold/HalinCard/HalinCard';

export default class AppFooter extends Component {
    render() {
        api.sentry.fine('build', build);
        const buildDate = moment.utc(build.date).format("YYYY-MM-DD");
        return (
            <HalinCard header='About Halin' className='AppFooter'>
                <h4>Halin v{appPkg.version}</h4>

                <p><Image style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto' }} src='favicon-32x32.png'/></p>

                <List>                    
                    <List.Item><a target='halindocs' href='https://moxious.github.io/halin/'>Documentation</a></List.Item>
                    <List.Item><a target='halindocs' href='https://github.com/moxious/halin'>Source Code (GitHub)</a></List.Item>
                </List>

                <p>
                    Build <a href={`https://circleci.com/gh/moxious/halin/${build.build}`}>{build.build} on {buildDate}</a>
                </p>    

                <h4>Neo4j Official Documentation</h4>

                <List>
                    <List.Item><a target='halindocs' href='https://neo4j.com/docs/operations-manual/current/'>Operations Manual</a></List.Item>
                    <List.Item><a target='halindocs' href='https://neo4j.com/docs/cypher-manual/current/'>Cypher Manual</a></List.Item>
                    <List.Item><a target='halindocs' href='https://neo4j.com/docs/getting-started/current/'>Getting Started</a></List.Item>
                </List>                
            </HalinCard>
        );
    }
}