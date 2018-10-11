import React, { Component } from "react";
import CypherDataTable from '../data/CypherDataTable';

import 'react-table/react-table.css';
import './Neo4jConfiguration.css';

class Neo4jConfiguration extends Component {
    // URL path to where a config item can be looked up.
    baseURL = 'https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/#config_';

    state = {
        rate: (1000 * 60 * 60),
        query: 'call dbms.listConfig()',
        displayColumns: [
            { 
                Header: 'Name', 
                accessor: 'name',
                Cell: props => 
                    <div className='Neo4jConfig_Name'>
                        <a 
                            target='neo4jConfig' 
                            href={this.baseURL + props.value}>
                            {props.value}
                        </a>                    
                    </div>
            },
            { 
                Header: 'Value', 
                accessor: 'value',
                Cell: props => 
                    <div className='Neo4jConfig_Value'>{props.value}</div>
            },
            // {
            //     Header: 'Editable?',
            //     accessor: 'editable',
            //     Cell: props => <div className='Neo4jConfig_Editable'>{ props.value ? 'yes' : 'no' }</div>
            // },
            { 
                Header: 'Description', 
                accessor: 'description',
                style: { whiteSpace: 'unset' }, // Permits text wrapping.
                Cell: props => <div className="Neo4jConfig_Description">{props.value}</div>
            },
        ],
    };
    
    editableConfigs = [
        'dbms.checkpoint.iops.limit',
        'dbms.logs.query.enabled',
        'dbms.logs.query.rotation.keep_number',
        'dbms.logs.query.rotation.size',
        'dbms.logs.query.threshold',
        'dbms.track.quer_allocation',
        'dbms.track_query_cpu_time',
        'dbms.transaction.timeout',
        'dbms.tx_log.rotation.retention_policy',
        'dbms.tx_log.rotation.size',
    ];

    render() {
        return (
            <div className="Neo4jConfiguration" style={{ align: 'center', height: 800 }}>
                <h3>Neo4j Configuration</h3>

                { (window.halinContext.getCurrentUser().roles.indexOf('admin') > -1) ? 
                <CypherDataTable
                    node={this.props.node}
                    driver={this.props.driver}
                    query={this.state.query}
                    displayColumns={this.state.displayColumns}
                    rate={this.state.rate}
                    /> : 
                <p>You must have administrative privileges to view configuration.  Your current login
                    has roles {window.halinContext.getCurrentUser().roles.join(', ')}
                </p> }
            </div>            
        );
    }
}

export default Neo4jConfiguration;