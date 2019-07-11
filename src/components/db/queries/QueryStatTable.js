import React from 'react';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';

const QueryStatTable = (props) => {
    return (
        <ReactTable
            defaultFilterMethod={(filter, row, column) => {
                const id = filter.pivotId || filter.id
                return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
            }}
            sortable={true}
            filterable={true}
            data={props.data}
            showPagination={true}
            defaultPageSize={Math.min(props.data.length, 10)}
            className="-striped -highlight"
            columns={props.displayColumns} 
        />
    );
}

QueryStatTable.props = {
    data: PropTypes.object.isRequired, // shape?
    displayColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default QueryStatTable;
