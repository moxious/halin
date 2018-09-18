import React, { Component } from 'react';
import "semantic-ui-css/semantic.min.css";
import { Grid } from 'semantic-ui-react';
import Overview from './Overview';
import JMXDisplay from '../jmx/JMXDisplay';
import { Cypher } from 'graph-app-kit/components/Cypher';
import Functions from './Functions';
import Procedures from './Procedures';
import PageCache from './PageCache';
import StoreFiles from './StoreFiles';
import './DiagnosticPane.css';
import uuid from 'uuid';

const renderJMX = ({ pending, error, result }) => {
    return pending ? (
      <div style={{ height: "60px" }}>pending</div>
    ) : error ? (
      <div style={{ height: "60px" }}>{error.message}</div>
    ) : result ? (
      <JMXDisplay data={result} />
    ) : null;
  };

class DiagnosticPane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className="DiagnosticPane" key={this.state.key}>
            {this.state.key}
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Overview key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <PageCache key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <StoreFiles key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <Functions key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>

                        <Grid.Column>
                            <Procedures key={this.state.key} node={this.props.node} driver={this.props.driver}/>
                        </Grid.Column>    
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Cypher query="CALL dbms.queryJmx('*:*')" render={renderJMX} interval={3000} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>  
            </div>
        );
    }
}

export default DiagnosticPane;