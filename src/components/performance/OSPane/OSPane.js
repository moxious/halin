import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from 'semantic-ui-react';

import PageCache from '../../diagnostic/PageCache/PageCache';
import StorageCapacity from '../../diagnostic/StorageCapacity/StorageCapacity';
import OSStats from '../OSStats/OSStats';
import uuid from 'uuid';

const OSPane = (props) => {
    const key = uuid.v4();

    return (
        <div className="OSPage">
            <Grid divided='vertically'>
                <Grid.Row columns={1}>
                    <Grid.Column>
                        <OSStats 
                            key={key} 
                            node={props.node} 
                        />
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row columns={2}>
                    <Grid.Column>
                        <StorageCapacity key={key} node={props.node} />
                    </Grid.Column>

                    <Grid.Column>
                        <PageCache key={`${key}1`} node={props.node} />
                    </Grid.Column>
                </Grid.Row>
                
                <Grid.Row>
                </Grid.Row>
            </Grid>  
        </div>
    );
}

OSPane.props = {
    node: PropTypes.object.isRequired, // shape?
}

export default OSPane;