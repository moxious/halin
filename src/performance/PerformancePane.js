import React, { Component } from 'react';
import "semantic-ui-css/semantic.min.css";
import { Grid, Card } from 'semantic-ui-react';
import MemoryMonitor from './MemoryMonitor';
import SystemLoad from './SystemLoad';
import GCMonitor from './GCMonitor';
import TransactionMonitor from './TransactionMonitor';
import ActiveQueries from './ActiveQueries';
// import ActiveTransactions from './ActiveTransactions';
// import Connections from './Connections';
// import Tasks from './task/Tasks';
import StoreFiles from '../diagnostic/StoreFiles';
import uuid from 'uuid';

class PerformancePane extends Component {
    render() {
        const key = uuid.v4();

        return (
            <div className="PerformancePane">
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Card.Group>
                            <SystemLoad key={key + '1'} node={this.props.node} />
                            <MemoryMonitor key={key + '2'} node={this.props.node} />
                            <TransactionMonitor key={key + '3'} node={this.props.node} />
                            <GCMonitor key={key + '4'} node={this.props.node} />
                        </Card.Group>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <ActiveQueries key={key} node={this.props.node}/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <StoreFiles key={key} node={this.props.node} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>  
            </div>
        );
    }
}

export default PerformancePane;