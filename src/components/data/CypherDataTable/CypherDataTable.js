import React, { Component } from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import { Grid } from 'semantic-ui-react';
import uuid from 'uuid';

import neo4j from '../../../api/driver';
import sentry from '../../../api/sentry/index';

import ColumnSelector from '../ColumnSelector/ColumnSelector';
import MemberLabel from '../../ui/scaffold/MemberLabel/MemberLabel';
import Spinner from '../../ui/scaffold/Spinner/Spinner';
import CSVDownload from '../download/CSVDownload';
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

        this.rate = props.rate || 5000;
        this.query = props.query;
        this.params = props.params || {};

        this.allowColumnSelect = _.isNil(props.allowColumnSelect) ? false : props.allowColumnSelect;
        this.allowDownloadCSV = _.isNil(props.allowDownloadCSV) ? false : props.allowDownloadCSV;

        // Immutable original display columns.  In the state, we will modify columns
        // as needed, but parent's won't be modified.
        this.originalDisplayColumns = props.displayColumns;

        // Properties for the data table.
        this.showPagination = (props.showPagination ?
            () => props.showPagination :
            () => this.state.items.length >= 7);
        this.defaultPageSize = (props.defaultPageSize ?
            () => props.defaultPageSize :
            () => 10);

        this.sortable = _.isNil(props.sortable) ? true : props.sortable;
        this.filterable = _.isNil(props.filterable) ? true : props.filterable;
        this.pageSizeOptions = _.isNil(props.pageSizeOptions) ? [5, 10, 20, 25, 50, 100] : props.pageSizeOptions;
        this.nodeLabel = props.hideMemberLabel ? false : true;

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

    UNSAFE_componentWillReceiveProps(props) {
        const refresh = this.state.refresh;
        if (refresh !== props.refresh) {
            this.setState({ refresh: props.refresh });
            // sentry.fine('CypherDataTable: refreshing on parent prop change');
            // Cancel the next polling cycle and start a fresh one to update.
            this.cancelPoll();
            this.sampleData();
        }
    }

    /**
     * User can pass a prop selectFilter=['foo','bar'] and we auto-build select filters for
     * those columns.
     */
    buildSelectFilters() {
        if (!this.props.selectFilter) { 
            return null;
        }

        this.props.selectFilter.forEach(accessor => {
            const col = this.state.displayColumns.filter(col => col.accessor === accessor)[0];
            if (!col) {
                sentry.warn(`Cannot create select filter for missing column ${accessor}`);
                return;
            }
            
            const possibleValues = _.uniq(this.state.items.map(item => item[accessor]));
            possibleValues.sort();

            const filterSpec = {
                filterMethod: (filter, row) => {
                    if (filter.value === 'all') {
                        return true;
                    }
                    return row[filter.id] === filter.value;
                },
                Filter: ({ filter, onChange }) => 
                    <select onChange={event => onChange(event.target.value)}
                        style={{ width: '100%' }}
                        value={filter ? filter.value : 'all'}
                    >
                        <option value='all'>All</option>
                        {
                            possibleValues.map((val, i) =>
                                <option value={val} key={i}>{val}</option>)
                        }
                    </select>
            };
        
            _.merge(col, filterSpec);
        });
    }

    onUpdate = () => {
        this.buildSelectFilters();

        if (this.props.onUpdate) {
            return this.props.onUpdate(this.state.items, this);
        }
    };

    sampleData() {
        return this.props.node.run(this.query, this.parameters, this.props.database)
            .then(results => {
                // Unpack results, but only for columns with an accessor
                // (as extra virtual columns may be defined)
                // All values are optional to prevent errors when a field might exist between
                // different versions of Neo4j.
                const items = neo4j.unpackResults(results, {
                    required: [],
                    optional: this.state.displayColumns.map(col => col.accessor).filter(a => a),
                });

                if (this.mounted) {
                    this.setState({ items }, this.onUpdate);

                    if (this.rate > 0) {
                        setTimeout(() => this.sampleData(), this.rate);
                    }
                }
                return items;
            })
            .catch(err => {
                sentry.reportError(err, `CypherDataTable: error executing ${this.query}`);
                this.setState({ items: [] }, this.onUpdate);
            });
    }

    updateColumns = (cols) => {
        sentry.fine('Showing', cols);

        const newColumns = _.cloneDeep(this.state.displayColumns);
        newColumns.forEach(thisCol => {
            if (cols.indexOf(thisCol.accessor) > -1) {
                thisCol.show = true;
            } else {
                thisCol.show = false;
            }
        });

        sentry.fine('New display columns', newColumns);
        return this.setState({ displayColumns: newColumns });
    };

    renderColumnSelector() {
        return (
            <Grid.Row columns={1}>
                <Grid.Column>
                    <ColumnSelector
                        onSelect={this.updateColumns}
                        displayColumns={this.state.displayColumns} /> 
                </Grid.Column>
            </Grid.Row>
        );
    }

    renderDownloadCSV() {
        return (
            <Grid.Row columns={1}>
                <Grid.Column>
                    <CSVDownload 
                        includeHidden={true}
                        data={this.state.items} 
                        displayColumns={this.state.displayColumns} />
                </Grid.Column>
            </Grid.Row>
        );
    }

    render() {
        return this.state.items ? (
            <div className='CypherDataTable'>
                <Grid>
                    { this.allowColumnSelect ? this.renderColumnSelector() : '' }
                    { this.allowDownloadCSV ? this.renderDownloadCSV() : '' } 

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <ReactTable className='-striped -highlight'
                                // By default, filter only catches data if the value STARTS WITH
                                // the entered string.  This makes it less picky.
                                defaultFilterMethod={(filter, row /* , column */) => {
                                    const id = filter.pivotId || filter.id
                                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                                }}
                                data={this.state.items}
                                sortable={this.sortable}
                                filterable={this.filterable}
                                defaultPageSize={this.defaultPageSize()}
                                pageSize={Math.min(this.state.items.length, 10)}
                                pageSizeOptions={this.pageSizeOptions}
                                showPagination={this.showPagination()}
                                columns={this.state.displayColumns}
                                onPageChange={this.onPageChange}
                                onPageSizeChange={this.onPageSizeChange}
                                onSortedChange={this.onSortedChange}
                                onResizedChange={this.onResizedChange}
                                onExpandedChange={this.onExpandedChange}
                            />

                            { this.nodeLabel ? <MemberLabel member={this.props.node}/> : '' }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        ) : <Spinner active={true}/>;
    }
}

export default CypherDataTable;