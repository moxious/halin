import React, { Component } from "react";
import CypherDataTable from '../data/CypherDataTable';
import hoc from '../higherOrderComponents';
import Explainer from '../Explainer';
import 'react-table/react-table.css';
import './Neo4jConfiguration.css';
import ql from '../data/queries/query-library';

class Neo4jConfiguration extends Component {
    // URL path to where a config item can be looked up.
    baseURL = 'https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/#config_';

    state = {
        rate: (1000 * 60 * 60),
        query: ql.disclaim(`
            CALL dbms.listConfig() 
            YIELD name, description, value 
            RETURN name, description, value
        `),
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

    help() {
        return (
            <div className='Neo4jConfigurationHelp'>
                <p>The following table displays the contents of the neo4j.conf file, which details
                    how the system is configured.
                </p>
                <p><a href="https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/">
                Read the Neo4j Configuration Reference</a></p>
            </div>
        )
    }

    render() {
        return (
            <div className="Neo4jConfiguration" style={{ align: 'center', height: 800 }}>
                <h3>Neo4j Configuration <Explainer content={this.help()}/></h3>

                <CypherDataTable
                    node={this.props.node}
                    query={this.state.query}
                    displayColumns={this.state.displayColumns}
                    rate={this.state.rate}
                    />
            </div>            
        );
    }
}

export default hoc.adminOnlyComponent(Neo4jConfiguration, 'Neo4j Configuration');