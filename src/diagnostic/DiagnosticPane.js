import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid, Icon, Popup } from 'semantic-ui-react';
import './DiagnosticPane.css';
import GeneratePackage from './GeneratePackage';
import ClusterEventLog from './ClusterEventLog';
import Ping from './Ping';
import uuid from 'uuid';
import Explainer from '../Explainer';

class DiagnosticPane extends Component {
    state = {
        key: uuid.v4(),
    };

    help() {
        return (
            <div className="DiagnosticsHelp">
                <p>This function runs a suite of tests and can provide advice on how
                to improve your configuration.</p>

                <p>A file will be generated with all
                    diagnostics, which you can send to Neo4j to help
                    troubleshoot issues.</p>
            </div>
        );
    }

    render() {
        return (
            <div className="DiagnosticPane" key={this.state.key}>
                <Grid divided='vertically'>
                    {/* <Grid.Row columns={1}>
                        <Grid.Column>
                            <Overview key={this.state.key} node={this.props.node}/>
                        </Grid.Column>
                    </Grid.Row> */}

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <h3>Run Diagnostics <Explainer content={this.help()}/></h3>

                            <GeneratePackage
                                key={this.state.key}
                                node={this.props.node}
                            />
                        </Grid.Column>
                    </Grid.Row>

                    {window.halinContext.isCluster() ?
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <ClusterEventLog />
                            </Grid.Column>
                        </Grid.Row> : ''}

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Ping key={this.state.key} node={this.props.node} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default DiagnosticPane;