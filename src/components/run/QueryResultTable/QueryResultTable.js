import React from 'react';
import PropTypes from 'prop-types';
import neo4j from '../../../api/driver';
import ReactTable from 'react-table';
import Neo4jResultValue from '../Neo4jResultValue/Neo4jResultValue';

const tbl = (recs, onResultClick) => {
    if (!recs.length) { throw new Error('Cannot make a table of no records'); }

    const style = { 
        textAlign: 'left',
        whiteSpace: 'pre-wrap',       /* Since CSS 2.1 */
        wordWrap: 'break-word',       /* Internet Explorer 5.5+ */
    };

    const props = {
        data: recs.map(r => r.toObject()),
        columns: recs[0].keys.map(k => ({ 
            Header: k, 
            accessor: k,
            style,
            Cell: e => <Neo4jResultValue val={e.value} onClick={onResultClick}/>,
        })),
        sortable: true,
        filterable: true,
        showPagination: true,
        pageSizeOptions: [5, 10, 20, 25, 50, 100],
        defaultPageSize: 10,
    };

    console.log(props);

    return (
        <ReactTable className='-striped -highlight' {...props} />
    );
};

const noResults = results => {
    return (
        <p>No results.</p>
    );
};

const metadata = results => {
    const execTime = neo4j.handleNeo4jInt(results.summary.resultAvailableAfter);
    return (
        <p>Results available after {execTime} ms</p>
    )
};

const QueryResultTable = (props = {}) => {
    console.log(props.results);
    return (
        <div className='QueryResultTable'>
            {
                props.results.records.length > 0 ?
                    tbl(props.results.records, props.onResultClick) :
                    noResults(props.results)
            }

            {metadata(props.results)}
        </div>
    );
};

QueryResultTable.defaultProps = {};

QueryResultTable.props = {
    query: PropTypes.string,
    results: PropTypes.object,
    onResultClick: PropTypes.func,
};

export default QueryResultTable;
