import React, { Component } from 'react';
import { Tab } from 'semantic-ui-react'
import ClusterMemberTabHeader from './ClusterMemberTabHeader';
import uuid from 'uuid';
import PerformancePane from './performance/PerformancePane';
import Neo4jConfiguration from './configuration/Neo4jConfiguration';
import OSPane from './performance/OSPane';
import PluginPane from './db/PluginPane';
import SampleQueryPane from './db/SampleQueryPane';


export default class MembersPane extends Component {
    state = {
        nodePanes: [],
        panes: (driver = null, node = null, key = uuid.v4()) => ([
            // Because panes get reused across cluster nodes, we have to 
            // give them all a unique key so that as we recreate panes, we're passing down
            // different props that get separately constructed, and not reusing the same
            // objects.  
            // https://stackoverflow.com/questions/29074690/react-why-components-constructor-is-called-only-once
            {
              menuItem: 'Performance',
              render: () => this.paneWrapper(
                <PerformancePane key={key} node={node}/>),
            },
            {
              menuItem: 'Configuration',
              render: () => this.paneWrapper(
                <Neo4jConfiguration key={key} node={node} />),
            },
            {
              menuItem: 'OS',
              render: () => this.paneWrapper(
                <OSPane key={key} node={node}/>),
            },
            {
              menuItem: 'Plugins',
              render: () => this.paneWrapper(
                <PluginPane key={key} node={node}/>),
            },
            {
              menuItem: 'Query Performance',
              render: () => this.paneWrapper(
                <SampleQueryPane key={key} node={node}/>),
            },
      
            // TODO
            // The following two panes are disabled and not yet tested/active, because they're
            // pending updates to an APOC component that isn't ready yet.
            // {
            //   menuItem: 'Metrics',
            //   render: () => this.paneWrapper(
            //     <MetricsPane key={key} node={node}/>
            //   ),
            // },
            // {
            //   menuItem: 'Logs',
            //   render: () => this.paneWrapper(
            //     <LogsPane key={key} node={node}/>),
            // }
          ]),      
    }

    paneWrapper(obj, cls = 'secondary') {
        return (
            <Tab.Pane>
                <div className={`PaneWrapper ${cls}`}>{obj}</div>
            </Tab.Pane>
        );
    }

    renderSingleNode(driver = null, node = null) {
        return <Tab menu={{ secondary: true, pointing: true }} panes={this.state.panes(driver, node)} />;
    }  

    componentWillMount() {
        this.setState({ halin: window.halinContext });

        const memberPanes = window.halinContext.members().map((member, key) => ({
            menuItem: {
              key: `node-${key}`,
              content: <ClusterMemberTabHeader key={key} node={member}/>,
            },
            render: () =>
              this.paneWrapper(
                this.renderSingleNode(this.state.halin.driverFor(member.getBoltAddress()), member),
                'primary'),
          }));

        this.setState({ memberPanes });
    }
    render() {
        return (
            <div className='MembersPane'>
                <Tab grid={{paneWidth: 14, tabWidth: 2}} menu={{ secondary: true, pointing: true, vertical: true, fluid: true, tabular: true }}
                    panes={this.state.memberPanes} />
            </div>
        );
    }
};