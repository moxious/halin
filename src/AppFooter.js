import React, { Component } from 'react';
import appPkg from './package.json';
import './AppFooter.css';
import { Button, Modal, Header } from 'semantic-ui-react'
import SettingsPane from './settings/SettingsPane';

export default class AppFooter extends Component {
    settings = () => {
        console.log('Foo');
    };

    render() {
        return (
            <div className='AppFooter'>
                <a target='halin' href='https://github.com/moxious/halin'>Halin v{appPkg.version}</a>
                &nbsp;|&nbsp;
                <a target='halin' href='https://neo4j.com/docs/operations-manual/current/'>Neo4j Operations Manual</a>
                &nbsp;&nbsp;
                <Modal 
                    trigger={<Button icon='settings'/>}>
                    <Header>Halin Internal Settings</Header>
                    <Modal.Content>
                        <SettingsPane/>
                    </Modal.Content>
                </Modal>
            </div>
        );
    }
}