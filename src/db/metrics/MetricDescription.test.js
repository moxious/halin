import React from 'react';
import ReactDOM from 'react-dom';
import MetricDescription from './MetricDescription';
import fakes from '../../testutils/fakes';

describe('Metric Description', function() {
    let component, node;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext([ { x: 1 }]);
        node = fakes.ClusterMember([ { x: 1 } ]);


        component = ReactDOM.render(
            <MetricDescription metric='foo.bar.baz'/>,
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
});