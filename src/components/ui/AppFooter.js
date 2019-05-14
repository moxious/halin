import React, { Component } from 'react';
import { Button, Modal, Header } from 'semantic-ui-react'

import appPkg from '../../package.json';
import './AppFooter.css';
import SettingsPane from '../settings/SettingsPane';

export default class AppFooter extends Component {
    render() {
        return (
            <div className='AppFooter'>
                <a target='halin' href='https://github.com/moxious/halin'>Halin v{appPkg.version}</a>
                &nbsp;|&nbsp;
                <a target='halin' href='https://neo4j.com/docs/operations-manual/current/'>Neo4j Operations Manual</a>
                &nbsp;&nbsp;
                <Modal size='fullscreen' closeIcon
                    trigger={<Button icon='settings'/>}>
                    <Header>Halin Internal Settings</Header>
                    <Modal.Content scrolling>
                        <SettingsPane/>
                    </Modal.Content>
                </Modal>
            </div>
        );
    }
}