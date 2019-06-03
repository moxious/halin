import React, { Component } from 'react'
import PropTypes from 'prop-types';

// Adapted from MIT licensed code here: https://github.com/mbrookes/react-mobile-signal-strength
class SignalMeter extends Component {
    state = {
        containerStyle: {
            width: 30,
            height: 30,
            padding: '2px',
            margin: '10px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            borderRadius: 2,
            background: 'transparent',
        },
    };

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
            <div style={this.state.containerStyle}>
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

export default SignalMeter