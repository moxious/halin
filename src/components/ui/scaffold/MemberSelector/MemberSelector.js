import React, { Component } from 'react';
import { Sidebar, Segment, Menu, Icon, Popup, Tab } from 'semantic-ui-react';
import uuid from 'uuid';

import score from '../../../../api/cluster/health/score';
import util from '../../../../api/data/util.js';
import PerformancePane from '../../../performance/PerformancePane';
import Neo4jConfiguration from '../../../configuration/Neo4jConfiguration';
import OSPane from '../../../performance/OSPane';
import PluginPane from '../../../db/PluginPane';
import SampleQueryPane from '../../../db/SampleQueryPane';
import LogsPane from '../../../db/LogsPane';

export default class MemberSelector extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        member: window.halinContext.members()[0],

        score: 1,
        total: 1,
        fresh: 1,
        notFresh: 0,
        performance: { observations: [] },

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

    sampleFeeds() {
        if (!this.mounted) { return null; }
        const currentState = score.feedFreshness(window.halinContext, this.state.member);
        this.setState(currentState);
    }

    componentDidMount() {
        this.mounted = true;
        this.interval = setInterval(() => this.sampleFeeds(), 500);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
    }

    select = (member) => {
        console.log("member selected", member);
        this.setState({ member });
    }

    popupContent = () => {
        return (
            <div className='PopupContent'>
                <h4>Data</h4>
                <p>{`${this.state.fresh} of ${this.state.total} fresh`}</p>

                <p>{this.state.performance.observations.length} observations; mean response time
                &nbsp;{util.roundToPlaces(this.state.performance.mean, 0)}ms with a standard deviation of
                &nbsp;{util.roundToPlaces(this.state.performance.stdev, 0)}ms</p>

                <p>When most/all feeds are fresh, this indicates responsiveness.  When performance
                degrades, data feeds slow, stop, or error.</p>
            </div>
        );
    };

    menuItem(member, key) {
        return (
            <Menu.Item as='a' key={key} onClick={() => this.select(member)}>
                <Popup
                    key={member.getBoltAddress()}
                    trigger={this.statusIcon(member)}
                    header={member.role}
                    content={this.popupContent()}
                    position='bottom left'
                />
                {member.getLabel()}
            </Menu.Item>
        );
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

    statusIcon = (member) => {
        const role = member.role.toLowerCase();

        let iconName;
        if (role === 'leader') { iconName = 'star'; }
        else if (role === 'read_replica') { iconName = 'copy'; }
        else { iconName = 'circle'; }  // Follower

        const color = this.colorFor(this.state.score);

        return (
            <Icon name={iconName} color={color} />
        );
    }

    colorFor = (score) => {
        if (score >= 0.8) { return 'green'; }
        if (score >= 0.6) { return 'yellow'; }
        return 'red';
    };

    render() {
        return (
            <Sidebar.Pushable as={Segment}
                style={{
                    marginTop: 0,
                    marginBottom: 0,
                    borderLeft: '1px solid white',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none',
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
                    {
                        window.halinContext.members().map((member, key) =>
                            this.menuItem(member, key))
                    }
                </Sidebar>
                <Sidebar.Pusher dimmed={false}>
                    {this.renderChildContent()}
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}