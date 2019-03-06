import React, { Component } from 'react';
import "semantic-ui-css/semantic.min.css";
import { Grid } from 'semantic-ui-react';
import DiskUsage from './DiskUsage';
import PageCache from '../diagnostic/PageCache';
// import StorageCapacity from '../diagnostic/StorageCapacity';
import OSStats from './OSStats';
import { Card } from 'semantic-ui-react';
import uuid from 'uuid';

class OSPane extends Component {
    render() {
        const key = uuid.v4();

        return (
            <Card.Group className="OSPage">
                            <OSStats 
                                key={key} 
                                node={this.props.node} 
                            />
                            <DiskUsage key={key} node={this.props.node} />


                        {/* 
                            TODO
                            The following component is not yet completed or tested because it
                            relies upon an APOC plugin that isn't finished yet.
                            Watch this space.

                            <Grid.Column>
                                <StorageCapacity key={key} node={this.props.node} />
                            </Grid.Column> 
                        */}

                            <PageCache key={`${key}1`} node={this.props.node} />
            </Card.Group>
        );
    }
}

export default OSPane;