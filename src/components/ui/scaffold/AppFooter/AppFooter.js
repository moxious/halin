import React, { PureComponent } from 'react';
import { List, Image } from 'semantic-ui-react';
import api from '../../../../api/';
import appPkg from '../../../../package.json';
import build from '../../../../build.json';
import moment from 'moment';

import './AppFooter.css';

import HalinCard from '../../scaffold/HalinCard/HalinCard';

export default class AppFooter extends PureComponent {
    render() {
        api.sentry.fine('build', build);
        const buildDate = moment.utc(build.date).format("YYYY-MM-DD");
        return (
            <HalinCard header={`About Halin v${appPkg.version}`} className='AppFooter'>
                <p><Image style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto' }} src='favicon-32x32.png'/></p>

                <strong>As of June 2021, Halin version 0.16.0 and Neo4j 4.3.0 halin is now deprecated, and will not
                support all 4.3.0+ features; you may encounter incompatibilities.</strong>

                <List>                    
                    <List.Item><a target='halindocs' href='https://moxious.github.io/halin/'>Documentation</a></List.Item>
                    <List.Item><a target='halindocs' href='https://github.com/moxious/halin/blob/master/release-notes.md#halin-release-notes'>Release Notes</a></List.Item>
                    <List.Item><a target='halindocs' href='https://github.com/moxious/halin'>Source Code (GitHub)</a></List.Item>
                </List>

                <p>
                    Build <a href={`https://circleci.com/gh/moxious/halin/${build.build}`}>{build.build} on {buildDate}</a>
                </p>    
            </HalinCard>
        );
    }
}