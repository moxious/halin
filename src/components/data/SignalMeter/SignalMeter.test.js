import React from 'react';
import ReactDOM from 'react-dom';
import SignalMeter from './SignalMeter';

describe('SignalMeter', function() {
    const setup = (props) => ReactDOM.render(
        <SignalMeter {...props} />,
        document.createElement('div'));

    it('at 100%, all 4 bars are green', () => {
        const component = setup({ strength: 100 });

        for (let x=1; x<=4; x++) {
            const barStyle = component.barStyle(x);

            expect(barStyle.background).toEqual('green');
        }
    });

    it('at 10%, 1 red bar', () => {
        const component = setup({ strength: 10 });

        const bar1 = component.barStyle(1);
        const bar2 = component.barStyle(2);
        const bar3 = component.barStyle(3);
        const bar4 = component.barStyle(4);

        expect(bar1.background).toEqual('red');
        [bar2, bar3, bar4].forEach(bar => expect(bar.background).toEqual('lightgrey'));
    });
});