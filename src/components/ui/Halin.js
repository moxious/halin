import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Button } from 'semantic-ui-react';

// API imports
import sentry from '../../api/sentry/index';
import status from '../../api/status/index';
import HalinContext from '../../api/HalinContext';

import Spinner from './Spinner';
import HalinToast from './scaffold/HalinToast/HalinToast';
import Troubleshooting from '../neo4jDesktop/Troubleshooting';

import './Halin.css';

import MainLeftNav from './scaffold/MainLeftNav/MainLeftNav';

export default class Halin extends Component {
  state = {
    cTag: 1,
    halin: null,
    initPromise: null,
    error: null,
  };

  componentDidMount() {
    try {
      window.halinContext = new HalinContext();

      const initPromise = window.halinContext.initialize()
        .catch(err => {
          sentry.reportError(err, 'Error initializing halin context');
          this.setState({ error: err });
          return window.halinContext;
        })
        .then(ctx => {
          this.setState({ halin: ctx });
        });

      this.setState({ initPromise });
    } catch (e) {
      sentry.error(e);
    }
  }

  componentWillUnmount() {
    window.halinContext.shutdown();
  }

  render() {
    const err = (this.state.error ? status.formatStatusMessage(this) : null);

    if (err) {
      return (
        <div className='MainBodyError'>
          {err}

          <Troubleshooting error={this.state.error} />

          <Button
            basic
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
            onClick={() => window.location.reload()}>
            <i className="icon refresh" /> Try Again
          </Button>
        </div>
      )
    }

    if (!this.state.halin) {
      return (
        <div className='Halin' key='app' style={{ marginTop: '50px' }}>
          <h2>Initializing Halin...</h2>

          <Spinner />
        </div>
      );
    }

    return (
      <div className="Halin" key="app">
        <HalinToast />
        { this.props.connected ? <MainLeftNav /> : '' }
      </div>
    );
  }
}
