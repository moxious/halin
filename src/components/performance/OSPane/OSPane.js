import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from 'semantic-ui-react';

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
                            node={props.member} 
                        />
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row columns={1}>
                    <Grid.Column>
                        <StorageCapacity key={key} node={props.member} />
                    </Grid.Column>
                </Grid.Row>                
            </Grid>  
        </div>
    );
}

OSPane.props = {
    member: PropTypes.object.isRequired, // shape?
};

export default OSPane;