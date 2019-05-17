import React from 'react';
import ReactDOM from 'react-dom';
import CypherSurface from './CypherSurface';
import fakes from '../../../testutils/fakes';

describe('Cypher Surface', function() {
    let component, node;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext([ { x: 1 }]);
        node = fakes.ClusterMember([ { x: 1 } ]);


        component = ReactDOM.render(
            <CypherSurface node={node}/>,
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
    it('fetches cypher surface from the ClusterMember', () => 
        expect(node.getCypherSurface.called).toBeTruthy());
    
    it('sets the data on its surface state element', () =>
        expect(component.state.surface).toBeTruthy());
});