import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import 'react-table/react-table.css';

import sentry from '../../../api/sentry/index';

import Neo4jDesktopStandIn from '../../initialConnection/Neo4jDesktopStandin';
import Halin from '../Halin/Halin';

const App = () => {
  sentry.init();

  return ( 
    <Neo4jDesktopStandIn username='neo4j' password='admin' host='localhost' port='7687' name='shim'>
      <Halin key="app" connected={true} />
    </Neo4jDesktopStandIn>
  );
};

export default App;
