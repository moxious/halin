import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import * as PropTypes from "prop-types";
import _ from 'lodash';

const neo4j = require("neo4j-driver/lib/browser/neo4j-web.min.js").v1;

class CypherDataTable extends Component {
    state = {
        items: null,
        refresh: null,
    };

    constructor(props, context) {
        super(props, context);

        this.driver = props.driver || context.driver;
        this.rate = props.rate || 5000;
        this.query = props.query;
        this.params = props.params || {};

        // Properties for the data table.
        this.displayColumns = props.displayColumns;
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

        if (!this.query) {
            throw new Error('must provide query');
        } else if(!this.displayColumns) {
            throw new Error('must provide displayColumns');
        }
    }

    componentDidMount() {
        this.mounted = true;
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
                    this.displayColumns.filter(col => col.accessor).forEach(col => {
                        const val = row.get(col.accessor);
                        item[col.accessor] = neo4j.isInt(val) ? neo4j.integer.toNumber(val) : val;
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
                this.setState({ items: [] });
            })
            .finally(() => session.close());
    }

    render() {
        return this.state.items ? (
            <div className='CypherDataTable'>
                <ReactTable 
                    data={this.state.items}
                    sortable={this.sortable}
                    filterable={this.filterable}
                    defaultPageSize={this.defaultPageSize()}
                    pageSizeOptions={this.pageSizeOptions}
                    showPagination={this.showPagination()}
                    columns={this.displayColumns}
                    onPageChange={this.onPageChange}
                    onPageSizeChange={this.onPageSizeChange}
                    onSortedChange={this.onSortedChange}
                    onResizedChange={this.onResizedChange}
                    onExpandedChange={this.onExpandedChange}
                />
            </div>
        ) : 'Loading...';
    }
}

CypherDataTable.contextTypes = {
    driver: PropTypes.object,
};

export default CypherDataTable;