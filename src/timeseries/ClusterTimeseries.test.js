import React from 'react';
import ReactDOM from 'react-dom';
import ClusterTimeseries from './ClusterTimeseries';
import uuid from 'uuid';
import fakes from '../testutils/fakes';

describe('Cluster Timeseries', function() {
    const key = uuid.v4();
    const query = 'RETURN 1 as x, 2 as y';
    // const displayColumns = [
    //     { Header: 'X', accessor: 'x' },
    //     { Header: 'Y', accessor: 'y' },
    // ];
    const rate = 11111;
    const returnData = [ 
        { x: 1, y: 2 },
        { x: 3, y: 4 },
    ];

    // let node;
    let component;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext(returnData);
        // node = fakes.ClusterMember(returnData);

        const props = {
            key, query, width: 400, rate, displayProperty: 'x',
        };

        component = ReactDOM.render(
            <ClusterTimeseries {...props}/>, 
            document.createElement('div'));
        
        // Data feed is a fake, provoke it to emit data.
        Object.values(component.feeds).map(f => f.fakeEvent());
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
});