import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import sentry from '../../api/sentry/index';

sentry.disable();

describe('App', function () {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
  });
});