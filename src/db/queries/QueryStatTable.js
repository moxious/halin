import React, { Component } from 'react';
import ReactTable from 'react-table';
import HalinQuery from '../../data/queries/HalinQuery';

export default class QueryStatTable extends Component {
    render() {
        const filterData = () => (
            this.props.includeHalinQueries ? 
            this.props.data : 
            this.props.data.filter(i => !HalinQuery.isDisclaimed(i.query)));

        return (
            <ReactTable
                defaultFilterMethod={(filter, row, column) => {
                    const id = filter.pivotId || filter.id
                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                }}
                sortable={true}
                filterable={true}
                data={filterData(this.props.data)}
                showPagination={true}
                defaultPageSize={Math.min(this.props.data.length, 10)}
                className="-striped -highlight"
                columns={this.props.displayColumns} />
        );
    }
};
