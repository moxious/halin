import React from 'react';
import ReactDOM from 'react-dom';
import AllocationChart from './AllocationChart';

describe('AllocationChart', function() {
    const props = {
        free: 99,
        total: 100,
        dataMeasurement: false,
        label: "Something",
    };
    const free = 99;
    const total = 100;
    let component;

    beforeEach(() => {
        component = ReactDOM.render(
            <AllocationChart {...props} />,
            document.createElement('div'));

        return component.UNSAFE_componentWillReceiveProps(props);
    });

    it('sets state correctly', () => {
        // console.log(component.state);
        expect(component.state.populated).toBeTruthy();
        expect(component.state.valid).toBeTruthy();
        expect(component.state.free).toEqual(free);
        expect(component.state.total).toEqual(total);
        expect(component.state.freePct).toEqual(free/total);
        expect(component.state.allocPct).toEqual(1 - (free/total));
    });

    it('can make data', () => {
        const data = component.makeData();

        expect(data[0].value).toEqual(component.state.allocPct * 100);
        expect(data[1].value).toEqual(component.state.freePct * 100);
        expect(data[0].color).toBeTruthy();
        expect(data[1].color).toBeTruthy();
        expect(data[0].title).toBeTruthy();
        expect(data[1].title).toBeTruthy();
    });
});