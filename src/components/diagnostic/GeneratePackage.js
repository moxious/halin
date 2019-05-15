import React, { Component } from 'react';
import { Button, Icon, Tab, Checkbox, Message } from 'semantic-ui-react';
import uuid from 'uuid';
import moment from 'moment';

import advisor from '../../api/diagnostic/advisor/index';
import collection from '../../api/diagnostic/collection/index';
import sentry from '../../api/sentry/index';
import status from '../../api/status/index';

import Spinner from '../ui/scaffold/Spinner/Spinner';
import Advisor from './advisor/Advisor';
import ConfigurationDiff from './ConfigurationDiff';
import hoc from '../higherOrderComponents';
import JSONDownload from '../data/download/JSONDownload';

const UPLOAD_DIAGNOSTICS_BY_DEFAULT = false;

class GeneratePackage extends Component {
    state = {
        key: uuid.v4(),
        message: null,
        error: null,
        loading: false,
        userIsAdmin: false,
        upload: UPLOAD_DIAGNOSTICS_BY_DEFAULT,
        headers: [
            { label: 'domain', key: 'domain' },
            { label: 'node', key: 'node' },
            { label: 'key', key: 'key' },
            { label: 'value', key: 'value' },
        ],
    };
    
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
                        return this.uploadDiagnostics(data);
                    }
                })
                .catch(err => fail(err));
        } catch (err) {
            fail(err);
        }

        sentry.info('Generating diagnostic package');
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
        // sentry.fine(event, data);
        this.setState({
            upload: data.checked,
        });
    }

    uploadDiagnostics(pkg) {
        const url = 'https://api.halin.graphapp.io/reporter-dev-report/';
        return fetch(url, {
            method: 'post',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',                
            },
            body: JSON.stringify(pkg),
        })
            .then(resp => sentry.fine('Reported diagnostic package', resp))
            .catch(err => sentry.error('Failed to upload', err));
    }

    render() {
        let message = status.formatStatusMessage(this);

        return (
            <div className='GeneratePackage'>
                <div style={{ marginBottom: '15px' }}>
                    <Message compact success>
                        <div>
                            <Checkbox 
                                checked={this.state.upload}
                                onClick={(event, data) => this.toggleUpload(event, data)}
                                label={{ children: 'Help improve Halin by sharing diagnostics with Neo4j' }}
                                >
                            </Checkbox>
                        </div>
                    </Message>
                </div>

                <Button primary disabled={this.state.loading}
                        onClick={this.generatePackage}>
                    <Icon name='cogs'/>
                    Run Diagnostics!
                </Button>

                { this.state.diagnosticData ? (
                    <JSONDownload 
                        data={this.state.diagnosticData}
                        title="Download Diagnostics"
                        filename={`neo4j-diagnostics-${this.state.dataGenerated}.json`}
                    />
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

export default hoc.adminOnlyComponent(GeneratePackage);