import React, { Component } from 'react';
import { Card, List } from 'semantic-ui-react';
import neo4j from '../../driver/index';
import _ from 'lodash';
import moment from 'moment';

const cardWrapper = (header, content) =>
    <Card>
        <Card.Content>
            <Card.Header>{header}</Card.Header>
            {content}
        </Card.Content>
    </Card>

// Shorthand for accessing a field.
const f = (task, field) => {    
    const val = neo4j.handleNeo4jInt(_.get(task, field)) || 'none';
    return typeof val === 'object' ? JSON.stringify(val) : val;
};

const dateify = val => moment.utc(val).format();
const age = since => {
    const start = moment.utc(since);
    const now = moment.utc();
    const duration = moment.duration(now.diff(start));
    return duration.asSeconds() + ' sec';
};

const displayQuery = q => 
    <div style={{
        maxHeight: 250,
        overflowY: 'scroll',
        overflowX: 'auto',
        textAlign: 'left',
    }}>{q}</div>

const connection = task => {
    const fields = [
        [ 'Client Address', f(task, 'connection.clientAddress') ],
        [ 'Connect Time', dateify(f(task, 'connection.connectTime')) ],
        [ 'Age', age(f(task, 'connection.connectTime')) ],
        [ 'Connector', f(task, 'connection.connector') ],
        [ 'Server Address', f(task, 'connection.serverAddress') ],
        [ 'User Agent', f(task, 'connection.userAgent') ],
        [ 'Username', f(task, 'connection.username') ],
    ];

    return cardWrapper('Connection',
        <List bulleted style={{textAlign: 'left'}}>
            { fields.map((field, i) => 
                <List.Item key={i}>
                    {field[0]}: {field[1]}
                </List.Item>)}
        </List>);
};

const transaction = task => {
    const fields = [
        [ 'Start Time', dateify(f(task, 'transaction.startTime')) ],
        [ 'Age', age(f(task, 'transaction.startTime')) ],
        [ 'Lock Count', f(task, 'transaction.activeLockCount') ],
        [ 'CPU Time (ms)', f(task, 'transaction.cpuTimeMillis') ],
        [ 'Elapsed Time (ms)', f(task, 'transaction.elapsedTimeMillis') ],
        [ 'Idle Time (ms)', f(task, 'transaction.idleTimeMillis') ],
        [ 'Wait Time (ms)', f(task, 'transaction.waitTimeMillis') ],
        [ 'Metadata', f(task, 'transaction.metaData') ],
    ];

    return cardWrapper('Transaction',
        <List bulleted style={{textAlign: 'left'}}>
            { fields.map((field, i) => 
                <List.Item key={i}>
                    {field[0]}: {field[1]}
                </List.Item>)}
        </List>);
};

const query = task => 
    cardWrapper('Query', displayQuery(f(task, 'query.query')));

export default class TaskDetail extends Component {
    field(f) {
        return _.get(this.props.task, f) || 'none';
    }

    render() {
        return (
            <div className='TaskDetail'>
                {this.props.task ? 
                <Card.Group>
                    { query(this.props.task) }
                    { _.isNil(_.get(this.props.task, 'connection')) ? '' : connection(this.props.task) }
                    { transaction(this.props.task) }
                </Card.Group> :
                'Please select a task' }
            </div>
        )
    }
};