import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import {
  GraphAppBase,
  CONNECTED
} from 'graph-app-kit/components/GraphAppBase';
import _ from 'lodash';

// API imports
import sentry from '../../../api/sentry/index';
import neo4j from '../../../api/driver';

import Neo4jDesktopStandIn from '../../neo4jDesktop/Neo4jDesktopStandin';
import Halin from '../Halin/Halin';

/**
 * Wrapper function for deciding what main "run mode" Halin is in, and doing the
 * right thing.  Down one path, we're a stand-alone webapp and the user gets a 
 * connect modal.  Down the other path, we're a graph app.
 * 
 * Irrespective which, the Halin component is the real app shell, and it expects
 * the same environment either way.
 */
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
