import React, { Component } from 'react';
import { Sidebar, Segment, Menu, Tab, Divider } from 'semantic-ui-react';

import DatabaseMenuItem from '../DatabaseMenuItem/DatabaseMenuItem';
import AddDatabaseMenuItem from '../DatabaseMenuItem/AddDatabaseMenuItem';
import DatabasePane from '../../../database/DatabasePane/DatabasePane';
import uuid from 'uuid';

import './DatabaseSelector.css';

export default class DatabaseSelector extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        selected: null,

        panes: () => {
            const menuItem = this.state.selected.getLabel();
            return [
                {
                    menuItem,
                    visible: () => true,
                    render: () => this.paneWrapper(
                        <DatabasePane
                            node={window.halinContext.getWriteMember()}
                            database={this.state.selected}
                        />
                    ),
                },
            ];
        },
    };

    UNSAFE_componentWillMount() {
        this.listenerFn = (e) => {
            const dbs = window.halinContext.getClusterManager().databases();

            // The selected database could no longer exist, or it could now exist with a different
            // status.  For all of these reasons we must update the selection so the view knows.
            // Never take the old selected, or you'll end up with wrong colored icon or
            // some other issue.
            let selected = dbs.filter(db => db.getLabel() === this.state.selected.getLabel())[0];
            if (!selected) {
                selected = dbs[0];
            }

            // Whether or not the selection changed, change state and force refresh.
            this.setState({ selected, id: uuid.v4() });
        };

        window.halinContext.getClusterManager().addListener(this.listenerFn);

        this.setState({
            selected: window.halinContext.getClusterManager().databases()[0],
        });
    }

    componentWillUnmount() {
        window.halinContext.getClusterManager().removeListener(this.listenerFn);
    }

    paneWrapper = (obj, cls = 'secondary') =>
        <Tab.Pane>
            <div className={`PaneWrapper ${cls}`}>{obj}</div>
        </Tab.Pane>;

    select = (selected) => this.setState({ selected });

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
                        window.halinContext.getClusterManager().databases().map((db, key) =>
                            <DatabaseMenuItem
                                database={db} key={key}
                                active={this.state.selected && this.state.selected.getLabel() === db.getLabel()}
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