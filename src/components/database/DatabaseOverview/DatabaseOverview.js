import React, { Component } from 'react';
import PropTypes from 'prop-types';

import HalinCard from '../../ui/scaffold/HalinCard/HalinCard';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import { List } from 'semantic-ui-react';
import moment from 'moment';

class DatabaseOverview extends Component {
    status(s) {
        if (s.currentStatus !== s.requestedStatus) {
            return `Transitioning from ${s.currentStatus} -&gt; ${s.requestedStatus}`;
        }

        return s.currentStatus;
    }

    errorInformation(s) {
        if (!s.error) { return ''; }
        return `Error Information: ${s.error}`;
    }

    render() {
        console.log(this.props);
        return (
            <HalinCard id="DatabaseOverview">
                <h3>Database Overview <Explainer knowledgebase='Database' /></h3>
               
                <List>
                    {
                        this.props.database.getMemberStatuses().map((s, i) => 
                            <List.Item key={i}>
                                {s.address}&nbsp;
                                <strong>{(''+s.role).toUpperCase()}</strong>&nbsp;
                                &nbsp;Status: { this.status(s) }
                                &nbsp;{ this.errorInformation(s) }
                            </List.Item>)
                    }

                </List>

                <p>Last updated: { moment(this.props.database.created).format() }</p>
            </HalinCard>
        );
    };
}

DatabaseOverview.props = {
    node: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired,
};

export default DatabaseOverview;