import React, { Component } from 'react';
import './MainLeftNav.css';
import { Sidebar, Segment, Menu, Icon, Image, Popup, Confirm } from 'semantic-ui-react';
import ClusterOverviewPane from '../../../overview/ClusterOverviewPane/ClusterOverviewPane';
import PermissionsPane from '../../../configuration/PermissionsPane/PermissionsPane';
import SettingsPane from '../../../settings/SettingsPane/SettingsPane';
import DiagnosticsPane from '../../../diagnostic/DiagnosticPane/DiagnosticPane';
import MemberSelector from '../MemberSelector/MemberSelector';
import sentry from '../../../../api/sentry';

const segmentStyle = {
    height: '100%',
    minHeight: 500,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
};

const hoverPopup = (text, trigger, key) =>
    <Popup inverted key={key}
        on='hover'
        position='right center'
        trigger={trigger}
        content={text} />;

export default class MainLeftNav extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        section: 'home',
        lastSection: 'home',
        toggleCounter: 0,
        clusterMember: window.halinContext.members()[0],
        logoutConfirmOpen: false,
    };

    section = section => {
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
            <Segment className="MainContent" basic style={segmentStyle}>{content}</Segment>
        );
    }

    renderChildContent() {
        if (this.state.section === 'home') {
            return this.segmentWrap(<ClusterOverviewPane />);
        } else if (this.state.section === 'members') {
            return this.segmentWrap(<MemberSelector clickCount={this.state.toggleCounter} />);
        } else if (this.state.section === 'users') {
            return this.segmentWrap(<PermissionsPane node={this.state.clusterMember} />);
        } else if (this.state.section === 'about') {
            return this.segmentWrap(<SettingsPane />);
        } else if (this.state.section === 'diagnostics') {
            return this.segmentWrap(<DiagnosticsPane />);
        }

        return 'No child tab';
    }

    logout = () => {
        sentry.fine('Logging out');
        window.halinContext.shutdown();
        window.halinContext = undefined;
        window.location.reload();
    };

    labsLabel() {
        return (
            <p style={{color: 'white'}}>Powered by<br/>
              <a 
                href="https://neo4j.com/labs/" 
                target="halindocs">Neo4j Labs <Icon name='lab'/></a>
            </p>
        );
    }

    render() {
        const size = 'large';

        const selections = [
            {
                section: 'home',
                text: 'Overview',
                visible: () => true,
                icon: <Image className='icon' style={{ filter: 'invert(100%)' }} src='favicon-32x32.png' />,
            },
            {
                section: 'members',
                text: 'Cluster Members',
                visible: () => true,
                icon: <Icon size={size} name='tv' />,
            },
            {
                section: 'users',
                text: 'Permissions Management',
                visible: () => window.halinContext.userIsAdmin(),
                icon: <Icon size={size} name='group' />,
            },
            {
                section: 'diagnostics',
                text: 'Cluster Diagnostic Tools',
                visible: () => true,
                icon: <Icon size={size} name='wrench' />,
            },
            {
                section: 'about',
                text: 'About',
                visible: () => true,
                icon: <Image className='icon' src='img/neo4j_logo_globe.png' />,
            },
        ];

        return (
            <Sidebar.Pushable as={Segment}
                style={{
                    marginTop: 0,
                    marginBottom: 0,
                }}>
                <Sidebar id='MainLeftNav'
                    as={Menu}
                    animation={this.state.animation}
                    direction={this.state.direction}
                    icon='labeled'
                    inverted
                    vertical
                    visible={this.state.visible}
                    width='thin'
                >
                    {
                        // Filter to only those that are visible, allowing us to check
                        // if the config permits that section for that user.
                        selections.filter(s => s.visible()).map((selection, index) =>
                            hoverPopup(selection.text,
                                <Menu.Item
                                    active={this.state.section === selection.section}
                                    index={index}
                                    as='a'
                                    style={selection.style || {}}
                                    onClick={() => this.section(selection.section)}>
                                    {selection.icon}
                                </Menu.Item>, index))
                    }

                    {
                        hoverPopup('Log Out',
                            <Menu.Item index={99} as='a'
                                onClick={() => {
                                    this.setState({ logoutConfirmOpen: true });
                                }}>
                                <Icon name='log out' />
                            </Menu.Item>, 99)
                    }

                    <Confirm open={this.state.logoutConfirmOpen}
                        header='Disconnect from Database'
                        onCancel={() => {
                            this.setState({ logoutConfirmOpen: false });
                        }}
                        onConfirm={this.logout} />

                    { this.labsLabel() }
                </Sidebar>
                <Sidebar.Pusher id='MainContent' dimmed={false}>
                    {this.renderChildContent()}
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}