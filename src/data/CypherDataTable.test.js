import React from 'react';
import ReactDOM from 'react-dom';
import CypherDataTable from './CypherDataTable';
import uuid from 'uuid';
import fakes from '../testutils/fakes';

describe('Cypher Data Table', function() {
    const key = uuid.v4();
    const query = 'RETURN "whatever" as value';
    const rate = 11111;
    const displayColumns = [
        { Header: 'X', accessor: 'x' },
        { Header: 'Y', accessor: 'y' },
    ];
    const returnData = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
    ];
    let node;
    let component;
    
    beforeEach(() => {
        window.halinContext = fakes.HalinContext(returnData);
        node = fakes.ClusterMember(returnData);

        const props = {
            sortable: true,
            filterable: true,
            node, displayColumns, rate, key, query,
            defaultPageSize: 11,
        };

        component = ReactDOM.render(
            <CypherDataTable {...props}/>, 
            document.createElement('div'));
    });

    it('renders without crashing', () => expect(component).toBeTruthy());
    
    it('set items on its state to the data it fetched', () =>
        expect(component.state.items).toEqual(returnData));

    it('knows how to update columns with the show flag', () => {
        const showSubset = [ 'x' ];
        component.updateColumns(showSubset);
        expect(component.state.displayColumns[0].show).toEqual(true);
        expect(component.state.displayColumns[1].show).toEqual(false);
    });
});