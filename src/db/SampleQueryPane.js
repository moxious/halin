import React, { Component } from 'react';
import uuid from 'uuid';
import SampleQueries from './SampleQueries';

export default class SampleQueryPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='SampleQueryPane'>
                <SampleQueries
                    key={this.state.key} 
                    node={this.props.node} 
                    driver={this.props.driver}
                />
            </div>
        )
    }
}