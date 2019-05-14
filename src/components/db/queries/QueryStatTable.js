import React, { Component } from 'react';
import ReactTable from 'react-table';

export default class QueryStatTable extends Component {
    render() {
        return (
            <ReactTable
                defaultFilterMethod={(filter, row, column) => {
                    const id = filter.pivotId || filter.id
                    return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                }}
                sortable={true}
                filterable={true}
                data={this.props.data}
                showPagination={true}
                defaultPageSize={Math.min(this.props.data.length, 10)}
                className="-striped -highlight"
                columns={this.props.displayColumns} />
        );
    }
};
