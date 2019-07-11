import React from 'react';
import ReactDOM from 'react-dom';
import OpenFileDescriptors from './OpenFileDescriptors';
import fakes from '../../../testutils/fakes';
import ql from '../../../api/data/queries/query-library';

describe('Open File Descriptors', function() {
    beforeEach(() => {
        window.halinContext = fakes.HalinContext(ql.OS_OPEN_FDS.exampleResult);
    });

    it('renders without crashing', () => {
        ReactDOM.render(
            <OpenFileDescriptors />, 
            document.createElement('div'));
    });
});