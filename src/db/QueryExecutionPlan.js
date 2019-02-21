import React, { Component } from 'react';
import { Button, Modal, Header } from 'semantic-ui-react'

export default class QueryExecutionPlan extends Component {
    render() {
        return (
            <div className='QueryExecutionPlan'>
                <h3>Query</h3>
                <pre>{this.props.data.query}</pre>
                <pre style={{textAlign: 'left'}}>{JSON.stringify(this.props.data.qep, null, 2)}</pre>            
            </div>
        );
    }
}