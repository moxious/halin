import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';
import './DiagnosticPane.css';
import GeneratePackage from '../GeneratePackage/GeneratePackage';
import ClusterEventLog from '../ClusterEventLog/ClusterEventLog';
import uuid from 'uuid';
import Explainer from '../../ui/scaffold/Explainer/Explainer';
import hoc from '../../higherOrderComponents';

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
                            <h3>Diagnostics <Explainer knowledgebase='Diagnostics' /></h3>

                            <GeneratePackage
                                key={this.state.key}
                                node={this.props.node}
                            />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <ClusterEventLog />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default hoc.contentPaneComponent(DiagnosticPane);