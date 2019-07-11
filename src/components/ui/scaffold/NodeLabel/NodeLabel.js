import React from 'react';
import PropTypes from 'prop-types';

import { Image, Popup } from 'semantic-ui-react';

const style = {
    hover: 'none',
}

/**
 * A simple UI label that can be attached to other elements, to indicate which Neo4j node
 * some data came from.
 */
const NodeLabel = (props) => {
    return (
        <Popup trigger={
            <div className="ui image label" style={style}>
                <Image src="img/neo4j_logo_globe.png" size="mini"/>
                {props.node ? props.node.getLabel() + ' ' + props.node.role : 'NONE' }
            </div>
        } content={
            props.node ? props.node.getLabel() : 'N/A'
        }/>
    );
}

NodeLabel.props = {
    node: PropTypes.object,
};

export default NodeLabel;