import React, { Component } from 'react';
import ReactTable from 'react-table';
import { Icon } from 'semantic-ui-react';
import './Advisor.css';

export default class Advisor extends Component {
    state = {
        findings: null,
        displayColumns: [
            { 
                Header: 'Level', 
                accessor: 'level',
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
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="pass">Pass</option>
                        <option value="error">Error</option>
                    </select>,
                Cell: ({ row }) => {
                    if (row.level === 'warning') {
                        return <Icon color='yellow' name='warning circle'/>;
                    } else if(row.level === 'error') {
                        return <Icon color='red' name='cancel'/>
                    } else if(row.level === 'info') {
                        return <Icon name='info'/>
                    } else {
                        return <Icon name='check circle' color='green'/>
                    }
                },
            },
            {
                Header: 'Finding',
                accessor: 'finding',
                style: { whiteSpace: 'unset', textAlign: 'left' },
            },
            {
                Header: 'Evidence',
                accessor: 'evidence',
                style: { whiteSpace: 'unset', textAlign: 'left' },
                show: false
            },
            {
                Header: 'Suggested Action',
                accessor: 'advice',
                style: { whiteSpace: 'unset', textAlign: 'left' }
            },
        ],
    };

    render() {
        return (this.props.data ?
            <div className='Advisor'>
                <h3>Advisor Results</h3>

                <p>We had a look at your configuration, and have some feedback.</p>

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
                    columns={this.state.displayColumns} />
            </div> :
            'Loading...'
        );
    }
}