import React from 'react';
import PropTypes from 'prop-types';
import ClusterMemberStatusIcon from '../ClusterMemberStatusIcon/ClusterMemberStatusIcon';

import { Label } from 'semantic-ui-react';

const style = {
    hover: 'none',
}

/**
 * A simple UI label that can be attached to other elements, to indicate which Neo4j node
 * some data came from.
 */
const MemberLabel = (props) => {
    return (
        <Label style={style}>
            <ClusterMemberStatusIcon {...props}/>
            {props.member ? props.member.getLabel() : 'NONE' }
            { props.detail ? <Label.Detail>{props.detail}</Label.Detail> : '' }
        </Label>
    );
}

MemberLabel.props = {
    member: PropTypes.object.isRequired,
};

export default MemberLabel;