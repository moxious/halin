import React, { Component } from 'react';
import { Sidebar, Segment, Menu, Tab, Icon, Divider } from 'semantic-ui-react';
// import sentry from '../../../../api/sentry';
import DatabaseMenuItem from '../DatabaseMenuItem/DatabaseMenuItem';
import CreateDatabase from '../../../database/CreateDatabase/CreateDatabase';
import DatabasePane from '../../../database/DatabasePane/DatabasePane';
import uuid from 'uuid';

import './DatabaseSelector.css';

export default class DatabaseSelector extends Component {
    state = {
        animation: 'push',
        visible: true,
        direction: 'left',
        selected: null,
        create: false,

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

        createPanes: () => [{
            menuItem: 'Create Database',
            visible: () => true,
            render: () => this.paneWrapper(
                <CreateDatabase 
                    member={window.halinContext.getWriteMember()} />),
        }],
    };

    UNSAFE_componentWillMount() {
        this.listenerFn = (e) => {
            const dbs = window.halinContext.databases();
            // The selected database could no longer exist, or it could now exist with a different
            // status.  For all of these reasons we must update the selection so the view knows.
            // Never take the old selected, or you'll end up with wrong colored icon or
            // some other issue.
            let selected = dbs.filter(db => db.getLabel() === this.state.selected.getLabel())[0];
            if (!selected) {
                selected = dbs[0];
            }
            
            // Whether or not the selection changed, change state and force refresh.
            if (!this.state.create) {
                // sentry.fine('DatabaseSelector: force selection', selected);
                this.setState({ selected, id: uuid.v4(), create: false });
            } else {
                // This is silly, to force state refresh.  We got a new list of
                // databases, but the selection didn't change and we're still in
                // create mode.
                this.setState({ id: uuid.v4(), create: true });
            }
        };

        window.halinContext.getClusterManager().addListener(this.listenerFn);

        this.setState({
            selected: window.halinContext.databases()[0],
            create: false,
        });
    }

    componentWillUnmount() {
        window.halinContext.getClusterManager().removeListener(this.listenerFn);
    }

    paneWrapper = (obj, cls = 'secondary') =>
        <Tab.Pane>
            <div className={`PaneWrapper ${cls}`}>{obj}</div>
        </Tab.Pane>;

    select = (selected) => this.setState({ selected, create: false });

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
                panes={
                    this.state.create ? 
                    this.state.createPanes() : 
                    this.state.panes(this.state.member).filter(p => p.visible())
                }
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
                        window.halinContext.databases().map((db, key) =>
                            <DatabaseMenuItem
                                database={db} key={key}
                                active={this.state.selected && this.state.selected.getLabel() === db.getLabel()}
                                onSelect={this.select} />)
                    }

                    { window.halinContext.getVersion().major >= 4 ? 
                    <Menu.Item as='a'
                        active={false}
                        onClick={() => this.setState({ create: true })}>
                        <Icon name='add' color='green' />
                        Create New Database
                    </Menu.Item> : '' }

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