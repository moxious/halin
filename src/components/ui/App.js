import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import {
  GraphAppBase,
  CONNECTED
} from 'graph-app-kit/components/GraphAppBase';
import _ from 'lodash';

// API imports
import sentry from '../../api/sentry/index';
import neo4j from '../../api/driver';

import './App.css';

import Neo4jDesktopStandIn from '../neo4jDesktop/Neo4jDesktopStandin';
import Halin from './Halin';

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
        render={({ connectionState /*, connectionDetails, setCredentials */ }) => {
          return (
            <Halin key="app" connected={connectionState === CONNECTED} />
          );
        }}
      />
    );
  }
};

export default App;
