import React from 'react';
import ReactDOM from 'react-dom';
import Spinner from './Spinner';

describe('Spinner', function () {
    let component;

    beforeEach(() => {
        component = ReactDOM.render(
            <Spinner />,
            document.createElement('div'));
    });

  it('renders without crashing', () => expect(component).toBeTruthy());
});