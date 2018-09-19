import React, { Component } from 'react';
import * as PropTypes from "prop-types";
import { Button, Icon } from 'semantic-ui-react';
import uuid from 'uuid';
import status from '../status/index';
import moment from 'moment';
import Advisor from './advisor/Advisor';
import advisor from './advisor/index';

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

        const fail = err => {
            console.error(err);
            this.setState({
                diagnosticData: null,
                dataGenerated: null,
                error: status.message('Failed to generate package', `${err}`),
            });
        };

        try {
            return window.halinContext.runDiagnostics()
                .then(data => {
                    this.setState({
                        diagnosticData: data,
                        dataGenerated: moment().format('YYYY-MM-DD-HH-mm-ss'),
                        message: status.message('Diagnostics Gathered!', 
                            'Please inspect your advisor results below, and download the package.'),
                    });
                })
                .catch(err => fail(err));
        } catch (err) {
            fail(err);
        }

        console.log('Generating package');
    };

    buildURI = data => {
        const pretty = JSON.stringify(data, null, 2);
        const blob = new Blob([pretty], { type: 'text/json' });
        const dataURI = `data:text/json;chartset=utf-8,${pretty}`;

        const URL = window.URL || window.webkitURL;

        return (typeof URL.createObjectURL === 'undefined') ? 
            dataURI :
            URL.createObjectURL(blob);
    };

    render() {
        let message = status.formatStatusMessage(this);

        return (
            <div className='GeneratePackage'>
                <Button basic
                        onClick={this.generatePackage}>
                    <Icon name='cogs'/>
                    Run Diagnostics!
                </Button>

                <div style={{
                    marginTop: '15px',
                    marginLeft: '50px',
                    marginRight: '50px',
                    marginBottom: '15px',
                }}>
                    { message }
                </div>

                { this.state.diagnosticData ? 
                    <Advisor 
                        key={uuid.v4()} 
                        data={advisor.generateRecommendations(this.state.diagnosticData)}
                    /> : 
                  '' }

                { this.state.diagnosticData ? (
                    <Button basic 
                        download={`neo4j-diagnostics-${this.state.dataGenerated}.json`}
                        href={this.buildURI(this.state.diagnosticData)}>
                        <Icon name="download"/>
                        Download Package
                    </Button>
                ) : '' }
            </div>
        );
    }
}

GeneratePackage.contextTypes = {
    driver: PropTypes.object,
};

export default GeneratePackage;