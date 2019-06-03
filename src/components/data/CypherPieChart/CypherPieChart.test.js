import React from 'react';
import ReactDOM from 'react-dom';
import CypherPieChart from './CypherPieChart';
import fakes from '../../../testutils/fakes';

describe('Cypher Pie Chart', function() {
    const query = 'Whatever';
    const returnData = [
        { label: 'X', value: 1, units: 'frobs' },
        { label: 'Y', value: 2, units: 'frobs' },
        { Header: 'Value', accessor: 'value' },
    ];
    let node;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext(returnData);
        node = fakes.ClusterMember(returnData);
    });

    it('renders without crashing', () => {
        ReactDOM.render(
            <CypherPieChart
                member={node}
                query={query}/>, 
            document.createElement('div'));
    });
});