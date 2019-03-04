import React, { Component } from 'react';
import fields from '../data/fields';
import Spinner from '../Spinner';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

class CypherSurface extends Component {
    state = {
        surface: null,
        displayColumns: [
            {
                Header: 'Type',
                accessor: 'type',
                width: 100,
                filterMethod: (filter, row) => {
                    if (filter.value === "all") {
                        return true;
                    }

                    return row[filter.id] === filter.value;
                },
                Filter: ({ filter, onChange }) =>
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">All</option>
                        <option value="function">Functions</option>
                        <option value="procedure">Procedures</option>
                    </select>,
            },
            {
                Header: 'Name',
                accessor: 'name',
                style: { whiteSpace: 'unset', textAlign: 'left' }
            },
            {
                Header: 'Signature',
                accessor: 'signature',
                style: { whiteSpace: 'unset', textAlign: 'left' }
            },
            {
                Header: 'Description',
                accessor: 'description',
                style: { whiteSpace: 'unset', textAlign: 'left' }
            },
            {
                Header: 'Roles',
                accessor: 'roles',
                Cell: fields.jsonField,
                style: { whiteSpace: 'unset', textAlign: 'left' },
                show: false,
            },
        ],
    };

    componentWillMount() {
        return this.props.node.getCypherSurface()
            .then(surface => {
                this.setState({ surface });
            })
            .catch(err => {
                console.error('Failed to get surface', err);
            });
    }

    render() {
        if (!this.state.surface) {
            return (
                <div className='CypherSurface'>
                    <Spinner/>
                </div>
            );
        }

        return (
            <div className='CypherSurface'>
                <h3>Installed Functions &amp; Procedures</h3>

                <ReactTable
                    // By default, filter only catches data if the value STARTS WITH
                    // the entered string.  This makes it less picky.
                    defaultFilterMethod={(filter, row, column) => {
                        const id = filter.pivotId || filter.id
                        return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                    }}
                    data={this.state.surface}
                    sortable={true}
                    filterable={true}
                    defaultPageSize={10}
                    showPagination={true}
                    columns={this.state.displayColumns}
                />
            </div>
        );
    }
}

export default CypherSurface;