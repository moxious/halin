import React, { Component } from 'react';
import { Form, Icon, Grid } from 'semantic-ui-react';
import uuid from 'uuid';
import sentry from '../../../api/sentry';
import QueryInput from '../QueryInput/QueryInput';
import QueryError from '../QueryError/QueryError';
import QueryResultTable from '../QueryResultTable/QueryResultTable';
import Spinner from '../../ui/scaffold/Spinner/Spinner';

class QueryRunner extends Component {
    state = {
        key: uuid.v4(),
        query: null,
        lastChange: null,
        pending: false,
        results: null,
        error: null,
    };

    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        this.setState(mod);
    }

    queryAsText() {
        return this.state.query ? this.state.query.getValue().trim() : '';
    }

    submit(event) {
        sentry.fine('Run query', this.state.query);
        sentry.fine('QUERY', this.queryAsText());
        event.preventDefault();
        const query = this.state.query.getValue().trim();

        this.setState({ pending: true });
        return this.props.node.run(query, {})
            .then(results => {
                this.setState({ error: null, results });
            })
            .catch(err => {
                this.setState({ error: err, results: null });
            })
            .finally(() => this.setState({ pending: false }));
    }

    onQueryUpdate = (query, change) => {
        this.setState({ query, change });
    };

    clear = () => {
        this.editor.getCodeMirror().setValue('');
    };

    queryInputForm() {
        return (
            <Form>
                <QueryInput
                    ref={ref => {
                        this.editor = ref;
                    }}
                    onChange={this.onQueryUpdate}
                />

                <Form.Button positive
                    disabled={this.state.pending}
                    onClick={data => this.submit(data)}
                    type='submit'>
                    <Icon name='play' /> Run
            </Form.Button>
                <Form.Button negative
                    onClick={this.clear}>
                    <Icon name='eraser' /> Clear
            </Form.Button>
            </Form>
        );
    }

    onResultClick = (e, thing, context) => {
        sentry.fine('QueryRunner click: ', thing, context);
    };

    showResults() {
        if (this.state.pending) {
            return <Spinner />;
        }

        if (this.state.error) {
            return <QueryError query={this.queryAsText()} error={this.state.error} />;
        }

        if (this.state.results) {
            return <QueryResultTable 
                    query={this.queryAsText()}
                    onResultClick={this.onResultClick}
                    results={this.state.results} 
                    />;
        }

        return 'Enter query to the left';
    }

    render() {
        return (
            <div className='QueryRunner'>
                <Grid divided='vertically'>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            { this.queryInputForm() }
                        </Grid.Column>
                        <Grid.Column>
                            { this.showResults() }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default QueryRunner;