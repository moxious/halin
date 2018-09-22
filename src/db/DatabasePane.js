import React, { Component } from 'react';
import DBSize from '../performance/DBSize';
import { Grid } from 'semantic-ui-react';
import uuid from 'uuid';

export default class DatabasePane extends Component {
    render() {
        const key = uuid.v4();

        return (
            <div className='DatabasePane'>
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <DBSize key={key}
                                node={this.props.node}
                                driver={this.props.driver} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        )
    }
}