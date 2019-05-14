import React from 'react';
import ReactDOM from 'react-dom';
import DiskUsage from './DiskUsage';
import sentry from '../api/sentry/index';
import fakes from '../testutils/fakes';
import ql from '../data/queries/query-library';

sentry.disable();

describe('Disk Usage', function () {
    let component, node;

    beforeEach(() => {
        const responseData = ql.JMX_STORE_SIZES.exampleResult
        window.halinContext = fakes.HalinContext(responseData);
        node = fakes.ClusterMember(responseData);
        component = ReactDOM.render(
            <DiskUsage node={node}/>,
            document.createElement('div'));
    });

  it('renders without crashing', () => expect(component).toBeTruthy());
});