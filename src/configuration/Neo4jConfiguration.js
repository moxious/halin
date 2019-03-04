import React, { Component } from "react";
import CypherDataTable from '../data/CypherDataTable';
import hoc from '../higherOrderComponents';
import Explainer from '../Explainer';
import 'react-table/react-table.css';
import './Neo4jConfiguration.css';
import queryLibrary from '../data/queries/query-library';
import _ from 'lodash';

class Neo4jConfiguration extends Component {
    // URL path to where a config item can be looked up.
    baseURL = 'https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/#config_';

    state = {
        rate: (1000 * 60 * 60),
        query: queryLibrary.DBMS_LIST_CONFIG.query,
        displayColumns: queryLibrary.DBMS_LIST_CONFIG.columns,
    };

    // Cell functions help render results.
    setCellFunction(accessor, fn) {
        const col = this.state.displayColumns.filter(c => c.accessor === accessor)[0];

        if (!col) { throw new Error('No such column'); }
        _.set(col, 'Cell', fn);
    }

    // Cell functions need to be set separately and not put into the query library
    // because they have react dependencies and need to refer to this component.
    componentDidMount() {
        this.setCellFunction('name', props =>
            <div className='Neo4jConfig_Name'>
                <a
                    target='neo4jConfig'
                    href={this.baseURL + props.value}>
                    {props.value}
                </a>
            </div>);

        this.setCellFunction('value', props =>
            <div className='Neo4jConfig_Value'>{props.value}</div>);

        this.setCellFunction('description',
            props => <div className="Neo4jConfig_Description">{props.value}</div>);
    }

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
                <h3>Neo4j Configuration <Explainer content={this.help()} /></h3>

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