import React, { Component } from 'react';
import './MainLeftNav.css';
import { Sidebar, Segment, Menu, Icon } from 'semantic-ui-react';
import ClusterOverviewPane from '../../../overview/ClusterOverviewPane';
import PermissionsPane from '../../../configuration/PermissionsPane';
import SettingsPane from '../../../settings/SettingsPane';
import MemberSelector from '../MemberSelector/MemberSelector';
import AppFooter from '../AppFooter/AppFooter';

const segmentStyle = {
    height: '100%',
    minHeight: 500,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
};

export default class MainLeftNav extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        section: 'home',
        lastSection: 'home',
        clusterMember: window.halinContext.members()[0],
    };

    section = section => {
        console.log('SECTION', section);

        if (section === 'members' && this.state.section === 'members') {
            // Toggle members off, go to previous state.
            return this.setState({
                section: this.state.lastSection,
            });
        }

        // Set new state.
        this.setState({ 
            section, 
            lastSection: this.state.section, 
        });
    };

    segmentWrap(content) {
        return (
            <Segment basic style={segmentStyle}>{content}</Segment>
        );
    }

    renderChildContent() {
        if (this.state.section === 'home') {
            return this.segmentWrap(<ClusterOverviewPane />);
        } else if (this.state.section === 'members') {
            return this.segmentWrap(<MemberSelector/>);
        } else if (this.state.section === 'users') {
            return this.segmentWrap(<PermissionsPane node={this.state.clusterMember}/>);
        } else if (this.state.section === 'settings') {
            return this.segmentWrap(<SettingsPane/>);
        }

        return 'No child tab';
    }

    render() {
        return (
            <Sidebar.Pushable as={Segment}
                style={{
                    marginTop: 0,
                    marginBottom: 0,
                }}>
                <Sidebar
                    as={Menu}
                    animation={this.state.animation}
                    direction={this.state.direction}
                    icon='labeled'
                    inverted
                    vertical
                    visible={this.state.visible}
                    width='thin'
                >
                    <Menu.Item index='0' as='a' onClick={() => this.section('home')}>
                        <Icon name='home' />
                        Overview
                    </Menu.Item>

                    <Menu.Item index='1' as='a' onClick={() => this.section('members')}>
                        <Icon name='computer' />
                        Members
                    </Menu.Item>
                    
                    <Menu.Item index='2' as='a' onClick={() => this.section('users')}>
                        <Icon name='group' />
                        User Management
                    </Menu.Item>

                    <Menu.Item index='3' as='a' onClick={() => this.section('settings')}>
                        <Icon name='cogs' />
                        Settings
                    </Menu.Item>
                    
                    <AppFooter />
                </Sidebar>
                <Sidebar.Pusher dimmed={false}>
                    { this.renderChildContent() }
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}