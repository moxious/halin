import React, { Component } from 'react';
import ReactTable from 'react-table';
import { Icon } from 'semantic-ui-react';
import CSVDownload from '../../data/download/CSVDownload';
import moment from 'moment';
import './Advisor.css';
import _ from 'lodash';

const filterMethod = (filter, row) => {
    if (filter.value === "all") {
        return true;
    }

    return row[filter.id] === filter.value;
};

export default class Advisor extends Component {
    state = {
        findings: null,
        displayColumns: [
            { 
                Header: 'Level', 
                accessor: 'level',
                width: 100,
                filterMethod,
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
                Header: 'Machine',
                accessor: 'addr',
                filterMethod,
                Filter: ({ filter, onChange }) =>
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">All</option>
                        {
                            this.getMachines().map((i, idx) =>
                                <option key={idx} value={i}>{i}</option>)
                        }
                    </select>,
            },
            {
                Header: 'Database',
                accessor: 'database',
                filterMethod,
                width: 100,
                Filter: ({ filter, onChange }) =>
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">All</option>
                        {
                            this.getDatabases().map((i, idx) =>
                                <option key={idx} value={i}>{i}</option>)
                        }
                    </select>,
            },
            {
                Header: 'Category',
                accessor: 'category',
                width: 100,
                filterMethod,
                Filter: ({ filter, onChange }) =>
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">All</option>
                        {
                            this.getCategories().map((i, idx) =>
                                <option key={idx} value={i}>{i}</option>)
                        }
                    </select>,
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

    getCategories() {
        if (!this.props.data) { return []; }
        const allCategories = this.props.data.map(i => i.category);
        return _.uniq(allCategories).sort();
    }

    getMachines() {
        if (!this.props.data) { return []; }
        const allAddrs = this.props.data.map(inspResult => inspResult.addr);
        return _.uniq(allAddrs).sort();
    }

    getDatabases() {
        if (!this.props.data) { return [] };
        const allDbs = this.props.data.map(inspResult => inspResult.database).filter(d => d);
        return _.uniq(allDbs).sort();
    }

    render() {
        return (this.props.data ?
            <div className='Advisor'>
                <h3>Advisor Results</h3>

                <p>We had a look at your configuration, and have some feedback.</p>

                <CSVDownload 
                    title="Results"
                    data={this.props.data}
                    displayColumns={this.state.displayColumns}
                    filename={`Halin-diagnostic-results-${moment.utc().format()}.csv`} />

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