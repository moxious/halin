import React, { Component } from 'react';
import { Sidebar, Segment, Menu, Tab, Divider } from 'semantic-ui-react';
import uuid from 'uuid';

import ClusterMemberOverview from '../../../performance/ClusterMemberOverview/ClusterMemberOverview';
import Neo4jConfiguration from '../../../configuration/Neo4jConfiguration/Neo4jConfiguration';
import OSPane from '../../../performance/OSPane/OSPane';
import PluginPane from '../../../db/PluginPane/PluginPane';
import SampleQueryPane from '../../../db/SampleQueryPane/SampleQueryPane';
import LogsPane from '../../../db/LogsPane/LogsPane';
import MetricsPane from '../../../db/metrics/MetricsPane/MetricsPane';
import Tasks from '../../../performance/task/Tasks/Tasks';
import ClusterMemberMenuItem from '../ClusterMemberMenuItem/ClusterMemberMenuItem';

import './MemberSelector.css';

// Defines how cluster members are sorted and ordered.
// Rules:
// - Display core members next
// - Display read replicas last.
// - Within a section, core or read replica, order by label.
// In case mode=SINGLE, we don't really have to care about ordering
// because there will only be one.
const memberOrdering = (a, b) => {
    const aMode = a.isCore() ? 'core' : 'replica';
    const bMode = b.isCore() ? 'core' : 'replica';

    if (aMode === bMode) {
        // Mode the same, compare by label
        return a.getLabel() < b.getLabel();
    }

    // A wins, it's core.
    if (aMode === 'core') {
        return -1;
    }

    // B wins.
    return 1;
};

export default class MemberSelector extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        member: window.halinContext.members()[0],

        panes: (member = null, key = uuid.v4()) => ([
            // Because panes get reused across cluster nodes, we have to 
            // give them all a unique key so that as we recreate panes, we're passing down
            // different props that get separately constructed, and not reusing the same
            // objects.  
            // https://stackoverflow.com/questions/29074690/react-why-components-constructor-is-called-only-once
            {
                menuItem: 'Overview',
                visible: () => true,
                render: () => this.paneWrapper(
                    <ClusterMemberOverview key={key} member={member} />),
            },
            {
                menuItem: 'Queries',
                visible: () => member.isEnterprise(),
                render: () => this.paneWrapper(
                    <Tasks key={key} node={member} />
                ),
            },
            {
                menuItem: 'Configuration',
                visible: () => true,
                render: () => this.paneWrapper(
                    <Neo4jConfiguration key={key} node={member} />),
            },
            {
                menuItem: 'OS',
                visible: () => true,
                render: () => this.paneWrapper(
                    <OSPane key={key} node={member} />),
            },
            {
                menuItem: 'Plugins',
                visible: () => true,
                render: () => this.paneWrapper(
                    <PluginPane key={key} node={member} />),
            },
            {
                menuItem: 'Query Performance',
                visible: () => window.halinContext.userIsAdmin(),
                render: () => this.paneWrapper(
                    <SampleQueryPane key={key} node={member} />),
            },
            {
              menuItem: 'Metrics',
              visible: () => true,
              render: () => this.paneWrapper(
                <MetricsPane key={key} node={member}/>
              ),
            },
            {
                menuItem: 'Logs',
                visible: () => true,
                render: () => this.paneWrapper(
                    <LogsPane key={key} node={member} />),
            }
        ]),
    };

    paneWrapper = (obj, cls = 'secondary') =>
        <Tab.Pane>
            <div className={`PaneWrapper ${cls}`}>{obj}</div>
        </Tab.Pane>;

    select = (member) => this.setState({ member });

    renderChildContent() {
        return (
            <Tab style={{
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 14,
                paddingBottom: 14,
            }}
                menu={{ secondary: true, pointing: true }}
                // Limit to panes which are visible under the given config.
                panes={this.state.panes(this.state.member).filter(p => p.visible())}
            />
        );
    }

    UNSAFE_componentWillReceiveProps(props) {
        // Menu click counter from the nav above us acts as a toggle for
        // the left-hand slide-out menu.
        const visible = props.clickCount % 2 === 0;
        this.setState({ visible });
    }

    render() {
        return (
            <Sidebar.Pushable id='MemberSelector' as={Segment}
                style={{
                    marginTop: 0,
                    marginBottom: 0,
                    borderLeft: '1px solid white',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none',
                }}>
                <Sidebar id='MemberSelectorSidebar'
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
                        window.halinContext.members().sort(memberOrdering).map((member, key) =>
                            <ClusterMemberMenuItem 
                                member={member} key={key}
                                active={this.state.member === member}
                                onSelect={this.select} />)
                    }

                    <Divider horizontal inverted />
                </Sidebar>
                <Sidebar.Pusher id="MemberPane" dimmed={false} className={
                    /* Width needs to adjust dynamically; see CSS */
                    this.state.visible ? 'sidebarVisible' : 'sidebarClosed'
                }>
                    {this.renderChildContent()}
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}