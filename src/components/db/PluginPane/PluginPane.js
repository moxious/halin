import React, { Component } from 'react';
import CypherSurface from '../CypherSurface/CypherSurface';
import uuid from 'uuid';
import PropTypes from 'prop-types';

class PluginPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='PluginPane'>
                <CypherSurface
                    key={this.state.key} 
                    node={this.props.member}
                />
            </div>
        )
    }
}

PluginPane.props = {
    member: PropTypes.object.isRequired, // shape?
};

export default PluginPane;