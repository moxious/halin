import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import * as PropTypes from "prop-types";
import _ from 'lodash';
import ColumnSelector from './ColumnSelector';
import './CypherDataTable.css';

const neo4j = require("neo4j-driver/lib/browser/neo4j-web.min.js").v1;

const toNumber = val => {
    if(_.isNil(val)) { return 'n/a'; }
    const num = parseInt(val, 10);
    return num.toLocaleString();
};

const convertMsToTime = (millis) => {
    if (_.isNil(millis)) { return 'n/a'; }

    let delim = " ";
    let hours = Math.floor(millis / (1000 * 60 * 60) % 60);
    let minutes = Math.floor(millis / (1000 * 60) % 60);
    let seconds = Math.floor(millis / 1000 % 60);
    const hoursStr = hours < 10 ? '0' + hours : hours;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;

    let str = secondsStr + 's';
    if (minutes > 0) { str = minutesStr + delim + str; }
    if (hours > 0) { str = hoursStr + delim + str; }

    return str;
};

class CypherDataTable extends Component {
    state = {
        items: null,
        refresh: null,
        displayColumns: null,
    };

    static jsonField(item) {
        return <div className='_jsonField'>{JSON.stringify(item.value)}</div>;
    }

    static numField(item) {
        <div className='_numberField'>{toNumber(item.value)}</div>;
    }

    static timeField(item) {
        <div className='_timeField'>{convertMsToTime(item.value)}</div>;
    }

    constructor(props, context) {
        super(props, context);

        if (!props.query) {
            throw new Error('must provide query');
        } else if(!props.displayColumns) {
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
        this.setState({ displayColumns: _.cloneDeep(this.originalDisplayColumns)});
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
                { 
                    this.allowColumnSelect ? 
                    <ColumnSelector 
                        onSelect={this.updateColumns}
                        displayColumns={this.state.displayColumns} /> : 
                    '' 
                }

                <ReactTable 
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
            </div>
        ) : 'Loading...';
    }
}

CypherDataTable.contextTypes = {
    driver: PropTypes.object,
};

export default CypherDataTable;