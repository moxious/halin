import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import CypherDataTable from '../data/CypherDataTable';

const cdt = CypherDataTable; // alias for shorthand

class PageCache extends Component {
    state = {
        rate: 2000,
        query: `
            CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Page cache')
            YIELD attributes 
            WITH 
                attributes.Faults.value as faults, 
                attributes.EvictionExceptions.value as evictionExceptions, 
                attributes.BytesWritten.value as bytesWritten, 
                attributes.Flushes.value as flushes, 
                attributes.UsageRatio.value as usageRatio, 
                attributes.Evictions.value as evictions, 
                attributes.FileUnmappings.value as fileUnmappings, 
                attributes.BytesRead.value as bytesRead, 
                attributes.FileMappings.value as fileMappings, 
                attributes.HitRatio.value as hitRatio 
            RETURN 
                hitRatio, bytesRead, fileMappings, fileUnmappings,
                flushes, usageRatio, bytesWritten, 
                faults, evictions, evictionExceptions;        
        `,
        displayColumns: [
            { Header: 'Usage Ratio', accessor: 'usageRatio', Cell: cdt.pctField },
            { Header: 'Hit Ratio', accessor: 'hitRatio', Cell: cdt.pctField },
            { Header: 'Bytes Read', accessor: 'bytesRead', Cell: cdt.dataSizeField },
            { Header: 'Bytes Written', accessor: 'bytesWritten', Cell: cdt.dataSizeField },

            { Header: 'Faults', accessor: 'faults', Cell: cdt.numField },            
            { Header: 'Flushes', accessor: 'flushes', Cell: cdt.numField },
            { Header: 'Evictions', accessor: 'evictions', Cell: cdt.numField },

            { Header: 'Eviction Except.', accessor: 'evictionExceptions', Cell: cdt.numField, show: false },
            { Header: 'File Mappings', accessor: 'fileMappings', Cell: cdt.numField, show: false },
            { Header: 'File Unmappings', accessor: 'fileUnmappings', Cell: cdt.numField, show: false },
        ],
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className='PageCache'>
                <h3>Page Cache Statistics</h3>
                <CypherDataTable
                    query={this.state.query}
                    allowColumnSelect={true}
                    displayColumns={this.state.displayColumns}
                    showPagination={false}
                    defaultPageSize={1}
                    sortable={false}
                    filterable={false}
                    rate={this.state.rate}/>
            </div>
        );
    }
}

PageCache.contextTypes = {
    driver: PropTypes.object,
};

export default PageCache;