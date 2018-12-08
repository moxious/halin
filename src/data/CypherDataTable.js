import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import * as PropTypes from "prop-types";
import _ from 'lodash';
import { Grid } from 'semantic-ui-react';
import ColumnSelector from './ColumnSelector';
import uuid from 'uuid';
import NodeLabel from '../NodeLabel';
import Spinner from '../Spinner';
import neo4j from '../driver';
import * as Sentry from '@sentry/browser';

import './CypherDataTable.css';

class CypherDataTable extends Component {
    state = {
        key: uuid.v4(),
        items: null,
        refresh: null,
        displayColumns: null,
    };

    constructor(props, context) {
        super(props, context);

        if (!props.query) {
            throw new Error('must provide query');
        } else if (!props.displayColumns) {
            throw new Error('must provide displayColumns');
        }

        this.driver = props.driver || context.driver;
        this.rate = props.rate || 5000;
        this.query = props.query;
        this.params = props.params || {};

        this.allowColumnSelect = _.isNil(props.allowColumnSelect) ? false : props.allowColumnSelect;

        // Immutable original display columns.  In the state, we will modify columns
        // as needed, but parent's won't be modified.
        this.originalDisplayColumns = props.displayColumns;

        // Properties for the data table.
        this.showPagination = (props.showPagination ?
            () => props.showPagination :
            () => this.state.items.length >= 7);
        this.defaultPageSize = (props.defaultPageSize ?
            () => props.defaultPageSize :
            () => Math.min(this.state.items.length, 10));

        this.sortable = _.isNil(props.sortable) ? true : props.sortable;
        this.filterable = _.isNil(props.filterable) ? true : props.filterable;
        this.pageSizeOptions = _.isNil(props.pageSizeOptions) ? [5, 10, 20, 25, 50, 100] : props.pageSizeOptions;

        // Callbacks
        const assignCallback = key => {
            this[key] = _.isNil(props[key]) ? () => null : props[key];
        };

        const signals = ['onPageChange', 'onPageSizeChange', 'onSortedChange', 'onFilteredChange',
            'onResizedChange', 'onExpandedChange'];
        signals.forEach(assignCallback);
    }

    componentDidMount() {
        this.mounted = true;
        this.setState({ displayColumns: _.cloneDeep(this.originalDisplayColumns) });
        this.sampleData();
    }

    componentWillUnmount() {
        this.mounted = false;
        this.cancelPoll();
    }

    cancelPoll() {
        if (this.interval) {
            clearTimeout(this.interval);
        }
    }

    componentWillReceiveProps(props) {
        const refresh = this.state.refresh;
        if (refresh !== props.refresh) {
            this.setState({ refresh: props.refresh });
            console.log('CypherDataTable: refreshing on parent prop change');
            // Cancel the next polling cycle and start a fresh one to update.
            this.cancelPoll();
            this.sampleData();
        }
    }

    sampleData() {
        const session = this.driver.session();

        return session.run(this.query, this.parameters)
            .then(results => {
                const items = results.records.map(row => {
                    const item = {};

                    // Loop through all columns with accessors to populate their 
                    // data
                    this.state.displayColumns.filter(col => col.accessor).forEach(col => {
                        try {
                            const val = row.get(col.accessor);
                            item[col.accessor] = neo4j.isInt(val) ? neo4j.integer.toNumber(val) : val;
                        } catch (e) {
                            const str = `${e}`;
                            if (str.indexOf('record has no field with key')) {
                                // This is survivable; in community some queries don't
                                // return all fields.
                                console.warn(str);
                                item[col.accessor] = col.absentValue || null;
                            } else {
                                throw e;
                            }
                        }
                    });

                    return item;
                });

                if (this.mounted) {
                    this.setState({ items });

                    if (this.rate > 0) {
                        setTimeout(() => this.sampleData(), this.rate);
                    }
                }
            })
            .catch(err => {
                console.error('CypherDataTable: error executing', this.query, this.parameters, err);
                Sentry.captureException(err);
                this.setState({ items: [] });
            })
            .finally(() => session.close());
    }

    updateColumns = (cols) => {
        console.log('Showing', cols);

        const newColumns = _.cloneDeep(this.state.displayColumns);
        newColumns.forEach(thisCol => {
            if (cols.indexOf(thisCol.accessor) > -1) {
                thisCol.show = true;
            } else {
                thisCol.show = false;
            }
        });

        console.log('New display columns', newColumns);
        return this.setState({ displayColumns: newColumns });
    };

    render() {
        return this.state.items ? (
            <div className='CypherDataTable'>
                <Grid>
                {
                    this.allowColumnSelect ?
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <ColumnSelector
                                    onSelect={this.updateColumns}
                                    displayColumns={this.state.displayColumns} /> 
                            </Grid.Column>
                        </Grid.Row>:
                        ''
                }

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <ReactTable
                                // By default, filter only catches data if the value STARTS WITH
                                // the entered string.  This makes it less picky.
                                defaultFilterMethod={(filter, row, column) => {
                                    const id = filter.pivotId || filter.id
                                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                                }}
                                data={this.state.items}
                                sortable={this.sortable}
                                filterable={this.filterable}
                                defaultPageSize={this.defaultPageSize()}
                                pageSizeOptions={this.pageSizeOptions}
                                showPagination={this.showPagination()}
                                columns={this.state.displayColumns}
                                onPageChange={this.onPageChange}
                                onPageSizeChange={this.onPageSizeChange}
                                onSortedChange={this.onSortedChange}
                                onResizedChange={this.onResizedChange}
                                onExpandedChange={this.onExpandedChange}
                            />

                            <NodeLabel node={this.props.node}/>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        ) : <Spinner active={true}/>;
    }
}

CypherDataTable.contextTypes = {
    driver: PropTypes.object,
};

export default CypherDataTable;