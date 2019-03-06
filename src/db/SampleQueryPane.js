import React, { Component } from 'react';
import uuid from 'uuid';
import SampleQueries from './SampleQueries';
import hoc from '../higherOrderComponents';

class SampleQueryPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='SampleQueryPane'>
                <SampleQueries
                    key={this.state.key} 
                    node={this.props.node} 
                />
            </div>
        )
    }
}

export default hoc.dbStatsOnlyComponent(SampleQueryPane);