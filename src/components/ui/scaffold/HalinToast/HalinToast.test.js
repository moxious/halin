import React from 'react';
import ReactDOM from 'react-dom';
import HalinToast from './HalinToast';

describe('Metric Description', function() {
    let component;
    
    beforeEach(() => {
        component = ReactDOM.render(
            HalinToast(),
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
});