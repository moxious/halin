import React, { Component } from 'react';
import { Button, Icon, Tab, Checkbox } from 'semantic-ui-react';
import Spinner from '../Spinner';
import uuid from 'uuid';
import status from '../status/index';
import moment from 'moment';
import Advisor from './advisor/Advisor';
import ConfigurationDiff from './ConfigurationDiff';
import advisor from './advisor/index';
import collection from './collection/index';
import sentry from '../sentry/index';

class GeneratePackage extends Component {
    state = {
        key: uuid.v4(),
        message: null,
        error: null,
        loading: false,
        userIsAdmin: false,
        upload: false,
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
            loading: true,
        });

        const fail = err => {
            sentry.error(err);
            this.setState({
                diagnosticData: null,
                dataGenerated: null,
                loading: false,
                error: status.message('Failed to generate package', `${err}`),
            });
        };

        try {
            return collection.runDiagnostics(window.halinContext)
                .then(data => {
                    this.setState({
                        loading: false,
                        diagnosticData: data,
                        dataGenerated: moment().format('YYYY-MM-DD-HH-mm-ss'),
                        message: null,
                        error: null,
                    });

                    if (this.state.upload) {
                        return this.uploadDiagnostics();
                    }
                })
                .catch(err => fail(err));
        } catch (err) {
            fail(err);
        }

        sentry.info('Generating diagnostic package');
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

    renderDiagnosticAdvice() {
        if (!this.state.diagnosticData) {
            return '';
        }

        const panes = [
            { 
                menuItem: 'Advisor', 
                render: () => 
                    <Tab.Pane>
                        <Advisor 
                            key={uuid.v4()} 
                            data={advisor.generateRecommendations(this.state.diagnosticData)}
                        />
                    </Tab.Pane>,
            },
        ];

        if (window.halinContext.isCluster()) {
            panes.push({ 
                menuItem: 'Configuration Diff', 
                render: () => 
                    <Tab.Pane>
                        <ConfigurationDiff data={this.state.diagnosticData} />
                    </Tab.Pane> 
            });
        }

        panes.push({
            menuItem: 'Package Viewer',
            render: () =>
                <Tab.Pane>
                    <div className='PackageViewer' style={{textAlign:'left'}}>
                        <pre>{JSON.stringify(this.state.diagnosticData.halin, null, 2)}</pre>
                    </div>
                </Tab.Pane>
        })

        return (<Tab menu={{ borderless: true, attached: false, tabular: false }} panes={panes} />);
    }

    componentDidMount() {
        if (window.halinContext.getCurrentUser().roles.indexOf('admin') === -1) {
            return this.setState({ userIsAdmin: false });
        }

        return this.setState({ userIsAdmin: true });
    }

    toggleUpload(event, data) {
        sentry.fine(event, data);
        this.setState({
            upload: data.checked,
        });
    }

    /*
    uploadDiagnostics(pkg) {
        return fetch('TBD', {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',                
            },
            body: JSON.stringify(pkg),
        })
            .then(resp => {
                sentry.fine('Upload response',resp);
            })
            .catch(err => {
                sentry.error('Failed to upload', err);
            });
    }
    */

    render() {
        let message = status.formatStatusMessage(this);

        return (
            <div className='GeneratePackage'>
                {/* <Checkbox 
                    checked={this.state.upload}
                    onClick={(event, data) => this.toggleUpload(event, data)}
                    label={{ children: 'Help improve Halin by sharing data with Neo4j' }}
                    >
                </Checkbox> */}

                <Button basic disabled={this.state.loading}
                        onClick={this.generatePackage}>
                    <Icon name='cogs'/>
                    Run Diagnostics!
                </Button>

                { this.state.diagnosticData ? (
                    <Button basic 
                        download={`neo4j-diagnostics-${this.state.dataGenerated}.json`}
                        href={this.buildURI(this.state.diagnosticData)}>
                        <Icon name="download"/>
                        Download Diagnostics
                    </Button>
                ) : '' }

                <div style={{
                    marginTop: '15px',
                    marginLeft: '50px',
                    marginRight: '50px',
                    marginBottom: '15px',
                }}>
                    { message }
                </div>

                {
                    this.state.loading ? <Spinner active={this.state.loading} /> : ''
                }

                { this.renderDiagnosticAdvice() }
            </div>
        );
    }
}

export default GeneratePackage;