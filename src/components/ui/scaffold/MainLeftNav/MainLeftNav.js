import React, { Component } from 'react';
import './MainLeftNav.css';
import { Sidebar, Segment, Menu, Icon, Image } from 'semantic-ui-react';
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
        toggleCounter: 0,
        clusterMember: window.halinContext.members()[0],
    };

    section = section => {
        console.log('SECTION', section);

        if (section === this.state.section) {
            // Tracking a counter of how many times this menu item has been
            // clicked allows us to propagate toggle state to child.
            return this.setState({
                toggleCounter: this.state.toggleCounter + 1,
            });
        }

        // Set new state.
        this.setState({ 
            section, 
            lastSection: this.state.section,
            toggleCounter: 0,
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
            return this.segmentWrap(<MemberSelector clickCount={this.state.toggleCounter} />);
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
                    <Menu.Item index={0} as='a' onClick={() => this.section('home')}>
                        <Image className='icon' style={{ filter:'invert(100%)' }} src='favicon-32x32.png'/>
                        Overview
                    </Menu.Item>

                    <Menu.Item index={1} as='a' onClick={() => this.section('members')}>
                        <Icon name='computer' />
                        Members
                    </Menu.Item>
                    
                    <Menu.Item index={2} as='a' onClick={() => this.section('users')}>
                        <Icon name='group' />
                        User Management
                    </Menu.Item>

                    <Menu.Item index={3} as='a' onClick={() => this.section('settings')}>
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