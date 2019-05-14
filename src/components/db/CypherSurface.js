import React, { Component } from 'react';
import Spinner from '../Spinner';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import CSVDownload from '../data/download/CSVDownload';
import sentry from '../../api/sentry/index';
import moment from 'moment';
import Explainer from '../Explainer';

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
        ],
    };

    componentWillMount() {
        return this.props.node.getCypherSurface()
            .then(surface => {
                this.setState({ surface });
            })
            .catch(err => sentry.reportError('Failed to get surface', err));
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
                <h3>Installed Functions &amp; Procedures 
                    <Explainer knowledgebase='CypherSurface' />
                </h3>

                <CSVDownload 
                    filename={`Cypher-surface-${this.props.node.getLabel()}-${moment.utc().format()}.csv`}
                    data={this.state.surface}
                    displayColumns={this.state.displayColumns} />

                <ReactTable
                    // By default, filter only catches data if the value STARTS WITH
                    // the entered string.  This makes it less picky.
                    defaultFilterMethod={(filter, row /* , column */) => {
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