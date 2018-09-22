import React, { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react';
import Overview from './Overview';
import './DiagnosticPane.css';
import GeneratePackage from './GeneratePackage';
import uuid from 'uuid';
// import JMXDisplay from '../jmx/JMXDisplay';
// import { Cypher } from 'graph-app-kit/components/Cypher';

// const renderJMX = ({ pending, error, result }) => {
//     return pending ? (
//       <div style={{ height: "60px" }}>pending</div>
//     ) : error ? (
//       <div style={{ height: "60px" }}>{error.message}</div>
//     ) : result ? (
//       <JMXDisplay data={result} />
//     ) : null;
//   };

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
                    </Grid.Row>

                    {/* <Grid.Row columns={1}>
                        <Grid.Column>
                            <Cypher query="CALL dbms.queryJmx('*:*')" render={renderJMX} interval={3000} />
                        </Grid.Column>
                    </Grid.Row> */}
                </Grid>  
            </div>
        );
    }
}

export default DiagnosticPane;