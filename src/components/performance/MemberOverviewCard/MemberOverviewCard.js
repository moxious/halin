import React from 'react';
import PropTypes from 'prop-types';
import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';

const MemberOverviewCard = (props) => {
    return (
        <HalinCard owner={this}>
            Member Overview
        </HalinCard>        
    );
}

MemberOverviewCard.props = {
    member: PropTypes.object.isRequired,
}

export default MemberOverviewCard;
