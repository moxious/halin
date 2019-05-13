import React from 'react';
import ReactDOM from 'react-dom';
import Explainer from './Explainer';

describe('Explainer', function() {
    let component;
    
    beforeEach(() => {
        component = ReactDOM.render(
            <Explainer knowledgebase='CypherSurface' />,
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
});