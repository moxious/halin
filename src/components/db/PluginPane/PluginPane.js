import React, { Component } from 'react';
import CypherSurface from '../CypherSurface/CypherSurface';
import uuid from 'uuid';

export default class PluginPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='PluginPane'>
                <CypherSurface
                    key={this.state.key} 
                    node={this.props.node}
                />
            </div>
        )
    }
}