import React, { Component } from 'react';
import {
  GraphAppBase,
  ConnectModal,
  CONNECTED
} from 'graph-app-kit/components/GraphAppBase';
import { Render } from 'graph-app-kit/components/Render';
import Neo4jConfiguration from './configuration/Neo4jConfiguration';
import PerformancePane from './performance/PerformancePane';
import DBSize from './performance/DBSize';
import PermissionsPane from './configuration/PermissionsPane';
import { Tab, Image } from 'semantic-ui-react'
import DiagnosticPane from './diagnostic/DiagnosticPane';

import './App.css';
import 'semantic-ui-css/semantic.min.css';
import HalinContext from './data/HalinContext';
import uuid from 'uuid';

const neo4j = require('neo4j-driver/lib/browser/neo4j-web.min.js').v1;

class Halin extends Component {
  state = {
    cTag: 1,
    halin: null,
    initPromise: null,
    panes: (driver=null, node=null, key=uuid.v4()) => ([
      // Because panes get reused across cluster nodes, we have to 
      // give them all a unique key so that as we recreate panes, we're passing down
      // different props that get separately constructed, and not reusing the same
      // objects.  
      // https://stackoverflow.com/questions/29074690/react-why-components-constructor-is-called-only-once
      {
        menuItem: 'Performance',
        render: () => this.paneWrapper(
          <PerformancePane key={key} node={node} driver={driver}/>),
      },
      {
        menuItem: 'User Management',
        render: () => this.paneWrapper(
          <PermissionsPane key={key} node={node} driver={driver}/>),
      },
      {
        menuItem: 'Database',
        render: () => this.paneWrapper(
          <DBSize key={key} node={node} driver={driver}/>),
      },
      {
        menuItem: 'Configuration',
        render: () => this.paneWrapper(
          <Neo4jConfiguration key={key} node={node} driver={driver}/>),
      },
    ]),
  };

  paneWrapper = obj =>
    <div className='PaneWrapper'>{obj}</div>;

  componentDidMount() {
    try {
      window.halinContext = new HalinContext();

      const initPromise = window.halinContext.initialize()
        .catch(err => {
          console.error('Error initializing halin context', err);
          return window.halinContext;
        })
        .then(ctx => {
          this.setState({ halin: ctx });
        });

      this.setState({ initPromise });
    } catch (e) {
      console.error(e);
    }
  }

  componentWillUnmount() {
    window.halinContext.shutdown();
  }

  renderCluster() {
    const nodePanes = this.state.halin.clusterNodes.map(node => ({
      menuItem: `${node.getAddress()} (${node.role})`,
      render: () => 
        this.paneWrapper(
          this.renderSingleNode(this.state.halin.driverFor(node.getBoltAddress()), node)),
    }));

    const diagnosticPane = {
      menuItem: 'Diagnostics',
      render: () => {
        const node = this.state.halin.clusterNodes[0];
        const driver = this.state.halin.driverFor(node.getBoltAddress());

        return (
          <DiagnosticPane 
            node={node}
            driver={driver}/>
        );
      },
    };

    return <Tab panes={nodePanes.concat([diagnosticPane])} />;
  }

  renderSingleNode(driver=null, node=null) {
    return <Tab panes={this.state.panes(driver, node)} />;
  }

  render() {
    return (!this.state.halin ? 'Loading...' : (
      <div className="App" key="app">
        <header className="App-header">
          <Image className="App-logo" src='img/halingraph.gif' size='tiny' />
        </header>

        <Render if={this.props.connected}>
          <div className='MainBody'>
            {this.renderCluster()}
          </div>
        </Render>
      </div>
    ));
  }
}

const App = () => {
  return (
    <GraphAppBase
      driverFactory={neo4j}
      integrationPoint={window.neo4jDesktopApi}
      render={({ connectionState, connectionDetails, setCredentials }) => {
        return [
          <ConnectModal
            key="modal"
            errorMsg={connectionDetails ? connectionDetails.message : ""}
            onSubmit={setCredentials}
            show={connectionState !== CONNECTED}
          />,
          <Halin key="app" connected={connectionState === CONNECTED} />
        ];
      }}
    />
  );
};

export default App;
