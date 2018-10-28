import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react';
import Overview from './Overview';
import './DiagnosticPane.css';
import GeneratePackage from './GeneratePackage';
import ClusterEventLog from './ClusterEventLog';
import Ping from './Ping';
import uuid from 'uuid';

class DiagnosticPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className="DiagnosticPane" key={this.state.key}>
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Overview key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>
                    </Grid.Row>

                    {/* 
                      * Diagnostic functionality only applies for enterprise installs, because of
                      * the stored procedures they rely on.
                      */}
                    { window.halinContext.isEnterprise() ? 
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <h3>Run Diagnostics</h3> 
                            
                            <p>This function runs a suite of tests and can provide advice on how
                               to improve your configuration.  A file will be generated with all
                               diagnostics, which you can send to Neo4j to help troubleshoot issues.</p>

                            <GeneratePackage 
                                key={this.state.key} 
                                node={this.props.node} 
                                driver={this.props.driver}
                            />
                        </Grid.Column>
                    </Grid.Row> : '' }

                    { window.halinContext.isCluster() ? 
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <ClusterEventLog />
                        </Grid.Column>
                    </Grid.Row> : '' }

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Ping key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>  
            </div>
        );
    }
}

export default DiagnosticPane;