import React, { Component } from 'react';
import { Sidebar, Segment, Menu, Tab } from 'semantic-ui-react';
import uuid from 'uuid';

import PerformancePane from '../../../performance/PerformancePane';
import Neo4jConfiguration from '../../../configuration/Neo4jConfiguration';
import OSPane from '../../../performance/OSPane';
import PluginPane from '../../../db/PluginPane';
import SampleQueryPane from '../../../db/SampleQueryPane';
import LogsPane from '../../../db/LogsPane';
import Tasks from '../../../performance/task/Tasks';
import ClusterMemberMenuItem from '../ClusterMemberMenuItem/ClusterMemberMenuItem';
import './MemberSelector.css';

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
                menuItem: 'Performance',
                render: () => this.paneWrapper(
                    <PerformancePane key={key} node={member} />),
            },
            {
                menuItem: 'Queries',
                render: () => this.paneWrapper(
                    <Tasks key={key} node={member} />
                ),
            },
            {
                menuItem: 'Configuration',
                render: () => this.paneWrapper(
                    <Neo4jConfiguration key={key} node={member} />),
            },
            {
                menuItem: 'OS',
                render: () => this.paneWrapper(
                    <OSPane key={key} node={member} />),
            },
            {
                menuItem: 'Plugins',
                render: () => this.paneWrapper(
                    <PluginPane key={key} node={member} />),
            },
            {
                menuItem: 'Query Performance',
                render: () => this.paneWrapper(
                    <SampleQueryPane key={key} node={member} />),
            },
            // {
            //   menuItem: 'Metrics',
            //   render: () => this.paneWrapper(
            //     <MetricsPane key={key} node={node}/>
            //   ),
            // },
            {
                menuItem: 'Logs',
                render: () => this.paneWrapper(
                    <LogsPane key={key} node={member} />),
            }
        ]),
    };

    paneWrapper = (obj, cls = 'secondary') =>
        <Tab.Pane>
            <div className={`PaneWrapper ${cls}`}>{obj}</div>
        </Tab.Pane>;

    select = (member) => {
        console.log("member selected", member);
        this.setState({ member });
    }

    renderChildContent() {
        return (
            <Tab style={{
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 14,
                paddingBottom: 14,
            }}
                menu={{ secondary: true, pointing: true }}
                panes={this.state.panes(this.state.member)}
            />
        );
    }

    componentWillReceiveProps(props) {
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
                        window.halinContext.members().map((member, key) =>
                            <ClusterMemberMenuItem 
                                member={member} key={key}
                                active={this.state.member === member}
                                onSelect={this.select} />)
                    }
                </Sidebar>
                <Sidebar.Pusher id="MemberPane" dimmed={false}>
                    {this.renderChildContent()}
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}