import React, { Component } from 'react';
import appPkg from './package.json';
import './AppFooter.css';

export default class AppFooter extends Component {
    render() {
        return (
            <div className='AppFooter'>
                <a target='halin' href='https://github.com/moxious/halin'>Halin v{appPkg.version}</a>
                &nbsp;|&nbsp;
                <a target='halin' href='https://neo4j.com/docs/operations-manual/current/'>Neo4j Operations Manual</a>
            </div>
        );
    }
}