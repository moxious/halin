import React, { Component } from 'react';
import { Breadcrumb } from 'semantic-ui-react';
import kb from '../../../api/knowledgebase';

export default class MetricDescription extends Component {
    render() {
        const crumbs = this.props.metric.split(/\./);
        return (
            <div className='MetricDescription' style={{textAlign:'center'}}>
                <Breadcrumb size='large'>
                    {
                        crumbs.map((piece, idx) =>
                            <span key={'bc-' + idx}>
                                <Breadcrumb.Section>{piece}</Breadcrumb.Section>
                                <Breadcrumb.Divider icon='right chevron' />
                            </span>)
                    }

                    <Breadcrumb.Section>
                        {kb.metricsReference[this.props.metric] || 'No description available'}
                    </Breadcrumb.Section>
                </Breadcrumb>
            </div>
        );
    }
}