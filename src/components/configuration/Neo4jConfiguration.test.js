import React from 'react';
import ReactDOM from 'react-dom';
import Neo4jConfiguration from './Neo4jConfiguration';
import ql from '../../api/data/queries/query-library';
import fakes from '../../testutils/fakes';
import uuid from 'uuid';

describe('Neo4j Configuration', function () {
    let n, component, props;

    beforeEach(() => {
        const testData = ql.DBMS_LIST_CONFIG.exampleResult;

        window.halinContext = fakes.HalinContext(testData);
        n = fakes.ClusterMember(testData);

        props = {
            key: uuid.v4(),
            node: n,            
        };

        component = ReactDOM.render(
            <Neo4jConfiguration {...props}/>,
            document.createElement('div'));
    });

  it('renders without crashing', () => expect(component).toBeTruthy());
});