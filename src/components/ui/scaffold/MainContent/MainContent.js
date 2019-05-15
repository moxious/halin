import React, { Component } from 'react';
import './MainContent.css';

export default class MainContent extends Component {
    render() {
        return (
            <span id='MainContent'>
                {this.props.children}
            </span>
        );
    }
}