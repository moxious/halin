import React, { Component } from 'react';
import "semantic-ui-css/semantic.min.css";
import { Grid } from 'semantic-ui-react';
import DiskUsage from './DiskUsage';
import PageCache from '../diagnostic/PageCache';
// import StorageCapacity from '../diagnostic/StorageCapacity';
import OSStats from './OSStats';
import uuid from 'uuid';

class OSPane extends Component {
    render() {
        const key = uuid.v4();

        return (
            <div className="OSPage">
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <OSStats 
                                key={key} 
                                node={this.props.node} 
                            />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row>
                        <Grid.Row>
                            <PageCache key={`${key}1`} node={this.props.node} />
                        </Grid.Row>
                    
                        {/* 
                            TODO
                            The following component is not yet completed or tested because it
                            relies upon an APOC plugin that isn't finished yet.
                            Watch this space.

                            <Grid.Column>
                                <StorageCapacity key={key} node={this.props.node} />
                            </Grid.Column> 
                        */}
                    </Grid.Row>
                    <Grid.Row columns={1}>
                    </Grid.Row>
                </Grid>  
            </div>
        );
    }
}

export default OSPane;