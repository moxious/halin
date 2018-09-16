import React, { Component } from "react";
import { Cypher } from "graph-app-kit/components/Cypher";
import {
  GraphAppBase,
  ConnectModal,
  CONNECTED
} from 'graph-app-kit/components/GraphAppBase';
import { Render } from 'graph-app-kit/components/Render';
import JMXDisplay from './jmx/JMXDisplay';
import Neo4jConfiguration from './configuration/Neo4jConfiguration';
import ActiveQueries from './performance/ActiveQueries';
import PerformancePane from './performance/PerformancePane';
import DBSize from './performance/DBSize';
import PermissionsPane from './configuration/PermissionsPane';
import { Tab, Image } from 'semantic-ui-react'

import './App.css';
import 'semantic-ui-css/semantic.min.css';

const neo4j = require("neo4j-driver/lib/browser/neo4j-web.min.js").v1;

const renderJMX = ({ pending, error, result }) => {
  return pending ? (
    <div style={{ height: "60px" }}>pending</div>
  ) : error ? (
    <div style={{ height: "60px" }}>{error.message}</div>
  ) : result ? (
    <JMXDisplay data={result} />
  ) : null;
};

class Halin extends Component {
  state = {
    cTag: 1
  };

  reRunManually = () => {
    this.setState(state => ({ cTag: state.cTag + 1 }));
  };

  paneWrapper = obj =>
    <div className='PaneWrapper'>{obj}</div>;

  render() {
    const panes = [
      {
        menuItem: 'Permissions',
        render: () => this.paneWrapper(<PermissionsPane/>),
      },
      {
        menuItem: 'Performance',
        render: () => this.paneWrapper(<PerformancePane/>),
      },
      {
        menuItem: 'Database',
        render: () => this.paneWrapper(<DBSize/>),
      },
      {
        menuItem: 'Active Queries',
        render: () => this.paneWrapper(<ActiveQueries />),
      },
      {
        menuItem: 'Configuration',
        render: () => this.paneWrapper(<Neo4jConfiguration />),
      },
      {
        menuItem: 'JMX / Diagnostics',
        render: () => this.paneWrapper(<Cypher query="CALL dbms.queryJmx('*:*')" render={renderJMX} interval={3000} />),
      },
    ]

    return (
      <div className="App" key="app">
        <header className="App-header">
          <span className="App-title">Halin Neo4j Monitoring</span>
          <Image className="App-logo" src='img/halingraph.gif' size='tiny'/>
        </header>

        <Render if={this.props.connected}>
          <div className='MainBody'>
            <Tab panes={panes} />
          </div>
        </Render>
      </div>
    );
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
