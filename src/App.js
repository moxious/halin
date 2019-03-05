import React, { Component } from 'react';
import sentry from './sentry/index';
import {
  GraphAppBase,
  CONNECTED
} from 'graph-app-kit/components/GraphAppBase';
import PermissionsPane from './configuration/PermissionsPane';
import ClusterOverviewPane from './overview/ClusterOverviewPane';
import MembersPane from './MembersPane';
import { Tab, Button } from 'semantic-ui-react'
import DiagnosticPane from './diagnostic/DiagnosticPane';
import Spinner from './Spinner';
import status from './status/index';
import AppFooter from './AppFooter';
import './App.css';

// CUSTOM-BUILT THEME
// import 'semantic-ui-css/semantic.min.css';
import './semantic/dist/semantic.min.css';

import HalinContext from './data/HalinContext';
import Neo4jDesktopStandIn from './neo4jDesktop/Neo4jDesktopStandIn';
import _ from 'lodash';
import Troubleshooting from './neo4jDesktop/Troubleshooting';
import neo4j from './driver';

class Halin extends Component {
  state = {
    cTag: 1,
    halin: null,
    initPromise: null,
    error: null,
  };

  paneWrapper = (obj, cls = 'secondary') =>
    <Tab.Pane>
      <div className={`PaneWrapper ${cls}`}>{obj}</div>
    </Tab.Pane>;

  componentDidMount() {
    try {
      window.halinContext = new HalinContext();

      const initPromise = window.halinContext.initialize()
        .catch(err => {
          sentry.reportError(err, 'Error initializing halin context');
          this.setState({ error: err });
          return window.halinContext;
        })
        .then(ctx => {
          this.setState({ halin: ctx });
        });

      this.setState({ initPromise });
    } catch (e) {
      sentry.error(e);
    }
  }

  componentWillUnmount() {
    window.halinContext.shutdown();
  }

  renderCluster() {
    const userMgmtPane = {
      menuItem: { key: 'User Management', content: 'User Management', icon: 'user' },
      render: () => {
        const clusterMember = this.state.halin.members()[0];
        return this.paneWrapper(
          <PermissionsPane node={clusterMember}/>,
          'primary'
        );
      },
    };

    const diagnosticPane = {
      menuItem: { key: 'Diagnostics', content: 'Diagnostics', icon: 'cogs' },
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
        content: 'Overview',
      },
      render: () => this.paneWrapper(<ClusterOverviewPane />, 'primary'),
    };

    const membersPane = {
      menuItem: {
        key: 'members',
        content: 'Members',
      },
      render: () => this.paneWrapper(<MembersPane />, 'primary'),
    };

    const allPanesInOrder = [overviewPane, membersPane];

    if (window.halinContext.supportsAuth() && window.halinContext.supportsNativeAuth()) {
      allPanesInOrder.push(userMgmtPane);
    }
    allPanesInOrder.push(diagnosticPane);

    return <Tab 
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

  render() {
    const err = (this.state.error ? status.formatStatusMessage(this) : null);

    if (err) {
      return (        
        <div className='MainBodyError'>
          { err }

          <Troubleshooting error={this.state.error}/>

          <Button 
            basic 
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
            onClick={() => window.location.reload()}>
            <i className="icon refresh"/> Try Again
          </Button>
        </div>
      )
    }

    if (!this.state.halin) {
      return (
        <div className='App' key='app' style={{ marginTop: '50px' }}>
          <h2>Initializing Halin...</h2>

          <Spinner/>
        </div>
      );
    }

    return (
      <div className="App" key="app">
        { this.props.connected ? 
          <div className='MainBody'>
            {err ? err : this.renderCluster()}
          </div>
          : '' }

        <AppFooter />
      </div>
    );
  }
}

const App = () => {
  sentry.init();
  
  // If this global is defined, we're running in desktop.  If it isn't, then we need
  // to use the shim object to convince the rest of the app we're in Desktop.
  const fakeDesktopApiNeeded = _.isNil(window.neo4jDesktopApi);

  if (fakeDesktopApiNeeded) {
    return (
      <Neo4jDesktopStandIn username='neo4j' password='admin' host='localhost' port='7687' name='shim'>
        <Halin key="app" connected={true} />
      </Neo4jDesktopStandIn>
    );
  } else {
    return (
      <GraphAppBase
        driverFactory={neo4j}
        integrationPoint={window.neo4jDesktopApi}
        render={({ connectionState, connectionDetails, setCredentials }) => {
          return (
            <Halin key="app" connected={connectionState === CONNECTED} />
          );
        }}
      />
    );
  }
};

export default App;
