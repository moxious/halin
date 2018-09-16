import React, { Component } from "react";
import Neo4jConfigurationItem from '../data/Neo4jConfigurationItem';
import TreeItem from '../data/TreeItem';
import * as PropTypes from "prop-types";
import _ from 'lodash';
import SortableTree from 'react-sortable-tree';

import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './Neo4jConfiguration.css';

class Neo4jConfiguration extends Component {
    query = 'call dbms.listConfig()';

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

    state = {
        config: {},
        columns: [
            { Header: 'Name', accessor: 'title' },
            { 
                Header: 'Value', 
                accessor: 'value',
                Cell: props => <div className='Neo4jConfig_Value'>{props.value}</div>
            },
            // {
            //     Header: 'Editable?',
            //     accessor: 'editable',
            //     Cell: props => <div className='Neo4jConfig_Editable'>{ props.value ? 'yes' : 'no' }</div>
            // },
            { 
                Header: 'Description', 
                accessor: 'subtitle',
                style: { whiteSpace: 'unset' }, // Permits text wrapping.
                Cell: props => <div className="Neo4jConfig_Description">{props.value}</div>
            },
        ],
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    componentDidMount() {
        const session = this.driver.session();

        console.log('Fetching config data');
        return session.run(this.query, {})
            .then(results => {
                const items = results.records.map(row => {
                    const item = new Neo4jConfigurationItem(
                        row.get('name'), 
                        row.get('description'), 
                        row.get('value'));
                   
                    item.setEditable(this.editableConfigs.indexOf(item.name) > -1);
                    return item;
                });

                this.setState({ 
                    items: _.sortBy(items, 'title'),
                    treeData: TreeItem.toTree(items).children,
                });
            })
            .catch(err => {
                console.error('Failed to get configuration', err);
                this.setState({ items: [] });
            })
    }

    onChange (treeData) {
        this.setState({ treeData });
    }

    onVisibilityToggle ({ treeData, node, expanded, path }) {
        // console.log('toggle',node);
    }  

    render() {
        return this.state.treeData ? (
            <div className="Neo4jConfiguration" style={{ align: 'center', height: 800 }}>
                <h3>Neo4j Configuration, Organized as a Table and Tree</h3>
                <ReactTable 
                    data={this.state.items}
                    sortable={true}
                    filterable={true}
                    columns={this.state.columns}
                />
                <SortableTree
                    treeData={this.state.treeData}
                    onChange={treeData => this.onChange(treeData)}
                    onVisibilityToggle={treeData => this.onVisibilityToggle(treeData)}
                    loadingText={'Loading...'}
                />
            </div>            
        ) : <div>Loading...</div>;
    }
}

Neo4jConfiguration.contextTypes = {
    driver: PropTypes.object
};

export default Neo4jConfiguration;