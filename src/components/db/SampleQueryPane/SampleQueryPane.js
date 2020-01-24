import React, { Component } from 'react';
import uuid from 'uuid';
import SampleQueries from '../SampleQueries/SampleQueries';
import hoc from '../../higherOrderComponents';
import PropTypes from 'prop-types';

class SampleQueryPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='SampleQueryPane'>
                <SampleQueries
                    key={this.state.key} 
                    node={this.props.member} 
                />
            </div>
        )
    }
}

SampleQueryPane.props = {
    member: PropTypes.object.isRequired, // shape?
};

export default hoc.dbStatsOnlyComponent(SampleQueryPane, 'Query Performance', false);