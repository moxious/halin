import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import 'react-table/react-table.css';

import sentry from '../../../api/sentry/index';

import ConnectionDetailsProvider from '../../initialConnection/ConnectionDetailsProvider';
import Halin from '../Halin/Halin';

const App = () => {
  sentry.init();

  return ( 
    <ConnectionDetailsProvider username='neo4j' password='admin' host='localhost' port='7687' name='shim'>
      <Halin/>
    </ConnectionDetailsProvider>
  );
};

export default App;
