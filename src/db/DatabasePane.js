import React, { Component } from 'react';
import DBSize from '../performance/DBSize';
import Functions from '../diagnostic/Functions';
import Procedures from '../diagnostic/Procedures';

import { Grid } from 'semantic-ui-react';
import uuid from 'uuid';

export default class DatabasePane extends Component {
    state = {
        key: uuid.v4(),
    };

    render() {
        return (
            <div className='DatabasePane'>
                <Grid divided='vertically'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <DBSize key={this.state.key}
                                node={this.props.node}
                                driver={this.props.driver} />
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
                </Grid>
            </div>
        )
    }
}