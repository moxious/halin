import React from 'react';
import ReactDOM from 'react-dom';
import Neo4jUsers from './Neo4jUsers';
import fakes from '../../../../testutils/fakes';
import uuid from 'uuid';
import sinon from 'sinon';

describe('Neo4jUsers', function() {
    let component, node, props;
    let users = [
        {
            username: 'foo', roles: ['admin'], flags: '',
        },
        {
            username: 'bar', roles: ['a', 'b'], flags: '',
        },
    ]; 

    beforeEach(() => {
        window.halinContext = fakes.HalinContext(users);
        node = fakes.ClusterMember(users);
        props = {
            node,
            refresh: sinon.stub(),
            key: uuid.v4(),
        };

        component = ReactDOM.render(
            <Neo4jUsers {...props} />,
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
});