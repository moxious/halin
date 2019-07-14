import React, { Component } from 'react';
import { Sidebar, Segment, Menu, Tab, Divider } from 'semantic-ui-react';

import DatabaseMenuItem from '../DatabaseMenuItem/DatabaseMenuItem';
import AddDatabaseMenuItem from '../DatabaseMenuItem/AddDatabaseMenuItem';
import DatabasePane from '../../../database/DatabasePane/DatabasePane';

import './DatabaseSelector.css';

export default class DatabaseSelector extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        selection: null,

        panes: () => ([
            {
                menuItem: 'Overview',
                visible: () => true,
                render: () => this.paneWrapper(
                    <DatabasePane 
                        node={window.halinContext.getWriteMember()} 
                        database={this.state.selection} 
                    />
                ),
            },
        ]),
    };

    componentWillMount() {
        this.setState({
            selection: window.halinContext.databases()[0],
        });
    }

    paneWrapper = (obj, cls = 'secondary') =>
        <Tab.Pane>
            <div className={`PaneWrapper ${cls}`}>{obj}</div>
        </Tab.Pane>;

    select = (selection) => this.setState({ selection });

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
                        window.halinContext.databases().map((db, key) =>
                            <DatabaseMenuItem 
                                database={db} key={key}
                                active={this.state.selected === db}
                                onSelect={this.select} />)
                    }

                    <AddDatabaseMenuItem />
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