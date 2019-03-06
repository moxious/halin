import React, { Component } from 'react';
import { Tab, Popup, Icon } from 'semantic-ui-react';
import ClusterOverviewPane from '../overview/ClusterOverviewPane';
import DiagnosticPane from '../diagnostic/DiagnosticPane';
import PermissionsPane from '../configuration/PermissionsPane';
import MembersPane from './MembersPane';
import './MainNav.css';

const tooltipIcon = (txt, icon) =>
    <Popup trigger={<Icon size='big' name={icon} />} content={txt} />;

export default class MainNav extends Component {
    state = {
        halin: window.halinContext,
    };

    paneWrapper = (obj, cls = 'secondary') =>
        <Tab.Pane>
            <div className={`PaneWrapper ${cls}`}>{obj}</div>
        </Tab.Pane>;

    render() {
        const userMgmtPane = {
            menuItem: {
                key: 'User Management',
                // content: 'User Management', 
                // icon: 'user'
                content: tooltipIcon('User Management', 'user'),
            },
            render: () => {
                const clusterMember = this.state.halin.members()[0];
                return this.paneWrapper(
                    <PermissionsPane node={clusterMember} />,
                    'primary'
                );
            },
        };

        const diagnosticPane = {
            menuItem: { 
                key: 'Diagnostics', 
                content: tooltipIcon('Diagnostics', 'cogs'),
                // content: 'Diagnostics', 
                // icon: 'cogs' 
            },
            render: () => {
                const clusterMember = this.state.halin.clusterMembers[0];
                return this.paneWrapper(
                    <DiagnosticPane
                        node={clusterMember} />,
                    'primary'
                );
            },
        };

        const overviewPane = {
            menuItem: {
                key: 'overview',
                // content: 'Overview',
                content: tooltipIcon('Overview', 'home'),
            },
            render: () => this.paneWrapper(<ClusterOverviewPane />, 'primary'),
        };

        const membersPane = {
            menuItem: {
                key: 'members',
                // content: 'Members',
                content: tooltipIcon('Cluster Members', 'bars'),
            },
            render: () => this.paneWrapper(<MembersPane />, 'primary'),
        };

        const allPanesInOrder = [overviewPane, membersPane];

        if (window.halinContext.supportsAuth() && window.halinContext.supportsNativeAuth()) {
            allPanesInOrder.push(userMgmtPane);
        }
        allPanesInOrder.push(diagnosticPane);

        return <Tab className='MainNav'
            grid={{
                paneWidth: 14,
                tabWidth: 2,
            }}
            menu={{
                fluid: true,
                vertical: true,
                tabular: true,
            }}
            panes={allPanesInOrder}
        />;
    }
};
