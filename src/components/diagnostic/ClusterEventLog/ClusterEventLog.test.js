import React from 'react';
import ReactDOM from 'react-dom';
import ClusterEventLog from './ClusterEventLog';
import fakes from '../../../testutils/fakes';

describe('Cluster Event Log', function() {
    let component;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext([ { x: 1 }]);

        component = ReactDOM.render(
            <ClusterEventLog/>,
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
    it('fetches cluster events from the manager', () => 
        expect(window.halinContext.getClusterManager().getEventLog.called).toBeTruthy());
});