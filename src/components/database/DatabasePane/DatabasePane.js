import React from 'react';
import PropTypes from 'prop-types';

import { Card } from 'semantic-ui-react';

import DiskUtilizationPieChart from '../DiskUtilizationPieChart/DiskUtilizationPieChart';
import AdministerDatabase from '../AdministerDatabase/AdministerDatabase';
import ApocMetaStats from '../ApocMetaStats/ApocMetaStats';
import DatabaseOverview from '../DatabaseOverview/DatabaseOverview';

const DatabasePane = (props) => {
    return (
        <Card.Group itemsPerRow={2} className="DatabasePane">
            <AdministerDatabase {...props} />
            <DatabaseOverview {...props} />
            { window.halinContext.supportsAPOC() ? <ApocMetaStats {...props} /> : '' }
            { 
                // Due to JMX changes in 4.0, this component isn't workable >= 4.0.
                window.halinContext.getVersion().major < 4 ? 
                <DiskUtilizationPieChart {...props} /> :
                ''
            }
        </Card.Group>
    );
}

DatabasePane.props = {
    database: PropTypes.object,
    node: PropTypes.object,
};

export default DatabasePane;
