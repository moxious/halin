import React from 'react';
import ReactDOM from 'react-dom';
import CypherTimeseries from './CypherTimeseries';
import uuid from 'uuid';
import fakes from '../../testutils/fakes';

describe('Cypher Timeseries', function() {
    const key = uuid.v4();
    const query = 'RETURN 1 as value';
    const displayColumns = [
        { Header: 'Value', accessor: 'value' },
    ];
    const returnData = [ {value: 1} ];
    let node;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext(returnData);
        node = fakes.ClusterMember(returnData);
    });

    it('renders without crashing', () => {
        ReactDOM.render(
            <CypherTimeseries key={key}
                node={node}
                query={query}
                displayColumns={displayColumns}/>, 
            document.createElement('div'));
    });
});