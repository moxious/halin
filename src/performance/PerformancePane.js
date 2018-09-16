import React, { Component } from 'react';
import "semantic-ui-css/semantic.min.css";
import { Grid } from 'semantic-ui-react';
// import HeapComponent from './HeapComponent';
import MemoryMonitor from './MemoryMonitor';
import SystemLoad from './SystemLoad';
import GCMonitor from './GCMonitor';
import ActiveQueries from './ActiveQueries';

class PerformancePane extends Component {
    render() {
        return (
            <div className="PerformancePane">
                <h3>Neo4j System Performance</h3>
                <Grid divided='vertically'>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <SystemLoad/>
                        </Grid.Column>

                        <Grid.Column>
                            <MemoryMonitor/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <ActiveQueries/>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <GCMonitor/>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>  
            </div>
        );
    }
}

export default PerformancePane;