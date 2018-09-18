import React, { Component } from 'react';
import * as PropTypes from "prop-types";
import { Button, Icon } from 'semantic-ui-react';
import uuid from 'uuid';
import status from '../status/index';
import { CSVLink } from 'react-csv';
import moment from 'moment';

class GeneratePackage extends Component {
    state = {
        key: uuid.v4(),
        message: null,
        error: null,
        headers: [
            { label: 'domain', key: 'domain' },
            { label: 'node', key: 'node' },
            { label: 'key', key: 'key' },
            { label: 'value', key: 'value' },
        ],
    };
    
    constructor(props, context) {
        super(props, context)
        this.driver = props.driver || context.driver;

    }

    generatePackage = () => {
        this.setState({
            message: status.message('Generating package', 'Please wait while data is gathered'),
        });

        const fail = err =>
            this.setState({
                diagnosticData: null,
                dataGenerated: null,
                error: status.message('Failed to generate package', `${err}`),
            });

        try {
            return window.halinContext.runDiagnostics()
                .then(data => {
                    this.setState({
                        diagnosticData: data,
                        dataGenerated: moment().format('YYYY-MM-DD-HH-mm-ss'),
                        message: status.message('Diagnostics gathered', 
                            'Data is now available for download, click the button below'),
                    });
                })
                .catch(err => fail(err));
        } catch (err) {
            fail(err);
        }

        console.log('Generating package');
    };

    render() {
        let message = status.formatStatusMessage(this);

        return (
            <div className='GeneratePackage'>
                <Button basic
                        onClick={this.generatePackage}>
                    <Icon name='download'/>
                    Generate Package
                </Button>

                { message }

                { this.state.diagnosticData ? (
                    <CSVLink 
                        headers={this.state.headers}
                        className="ui basic button"
                        filename={`neo4j-diagnostics-${this.state.dataGenerated}.csv`}
                        data={this.state.diagnosticData}>
                        Download Package
                    </CSVLink>
                ) : '' }
            </div>
        );
    }
}

GeneratePackage.contextTypes = {
    driver: PropTypes.object,
};

export default GeneratePackage;