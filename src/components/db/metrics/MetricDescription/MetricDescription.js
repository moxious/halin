import React, { Component } from 'react';
import kb from '../../../../api/knowledgebase';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';

export default class MetricDescription extends Component {
    render() {
        return (
            <div className='MetricDescription'>
                <h3>
                    Metric: {this.props.metric || 'Select a Metric'}
                    <Explainer 
                        intro={<p>{kb.metricsReference[this.props.metric]}</p>} 
                        knowledgebase='CSVMetrics'
                    />
                </h3>
            </div>
        )
    }
}