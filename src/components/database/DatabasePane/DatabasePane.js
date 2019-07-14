import React from 'react';
import PropTypes from 'prop-types';

import { Card } from 'semantic-ui-react';

import DiskUtilizationPieChart from '../DiskUtilizationPieChart/DiskUtilizationPieChart';
import AdministerDatabase from '../AdministerDatabase/AdministerDatabase';

const DatabasePane = (props) => {
    return (
        <Card.Group itemsPerRow={2} className="DatabasePane">
            <AdministerDatabase {...props} />
            <DiskUtilizationPieChart {...props} /> 
        </Card.Group>
    );
}

DatabasePane.props = {
    database: PropTypes.object,
    node: PropTypes.object,
};

export default DatabasePane;
