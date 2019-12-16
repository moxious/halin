import React from 'react';
import PropTypes from 'prop-types';
import ClusterMemberStatusIcon from '../ClusterMemberStatusIcon/ClusterMemberStatusIcon';

import { Label, Popup } from 'semantic-ui-react';

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
            <Label icon style={style}>
                <ClusterMemberStatusIcon {...props}/>
                {props.member ? props.member.getLabel() : 'NONE' }
                { props.detail ? <Label.Detail>{props.detail}</Label.Detail> : '' }
            </Label>
        } content={
            props.member ? props.member.getLabel() : 'N/A'
        }/>
    );
}

NodeLabel.props = {
    member: PropTypes.object.isRequired,
};

export default NodeLabel;