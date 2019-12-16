import React, { PureComponent } from 'react'
import PropTypes from 'prop-types';

const style = {
    containerStyle: {
        width: 60,
        height: 60,
        padding: '2px',
        margin: '10px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderRadius: 2,
        background: 'transparent',
    },
};

// Adapted from MIT licensed code here: https://github.com/mbrookes/react-mobile-signal-strength
class SignalMeter extends PureComponent {
    barStyle(bar) {
        let color;

        if (this.props.strength >= 75) {
            color = 'green';
        } else if (this.props.strength > 25) {
            color = 'yellow';
        } else {
            color = 'red';
        }

        return {
            borderRadius: 2,
            width: '20%',
            height: `${25 * bar}%`,
            background: this.props.strength >= 25 * (bar - 1) + 10 ? color : 'lightgrey',
        }
    }

    render() {
        return (
            <div style={style.containerStyle}>
                <div style={this.barStyle(1)} />
                <div style={this.barStyle(2)} />
                <div style={this.barStyle(3)} />
                <div style={this.barStyle(4)} />
            </div>
        )
    }
}

SignalMeter.propTypes = {
    strength: PropTypes.number.isRequired,
}

export default SignalMeter;
