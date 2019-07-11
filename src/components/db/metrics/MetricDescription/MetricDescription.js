import React from 'react';
import PropTypes from 'prop-types';

import kb from '../../../../api/knowledgebase';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';

const MetricDescription = (props = {}) => {
    return (
        <div className='MetricDescription'>
            <h3>
                Metric: {props.metric || 'Select a Metric'}
                <Explainer 
                    intro={<p>{kb.metricsReference[props.metric]}</p>} 
                    knowledgebase='CSVMetrics'
                />
            </h3>
        </div>
    );
}

MetricDescription.props = {
    metric: PropTypes.string,
};

export default MetricDescription;
