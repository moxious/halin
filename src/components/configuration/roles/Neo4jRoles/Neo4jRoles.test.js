import React from 'react';
import ReactDOM from 'react-dom';
import Neo4jRoles from './Neo4jRoles';
import fakes from '../../../../testutils/fakes';
import uuid from 'uuid';
import sinon from 'sinon';

describe('Metric Description', function() {
    let component, node, props;
    let roles = [
        {
            role: 'foo', users: ['a', 'b'],
        },
        {
            role: 'bar', users: ['c', 'd'],
        },
    ]; 

    beforeEach(() => {
        window.halinContext = fakes.HalinContext(roles);
        node = fakes.ClusterMember(roles);
        props = {
            node,
            refresh: sinon.stub(),
            key: uuid.v4(),
        };

        component = ReactDOM.render(
            <Neo4jRoles {...props} />,
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
});