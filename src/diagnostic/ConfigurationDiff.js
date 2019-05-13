import React, { Component } from 'react';
import diffutil from '../data/diff/index';
import ReactTable from 'react-table';
import { Icon } from 'semantic-ui-react';
import sentry from '../sentry/index';
import _ from 'lodash';

export default class ConfigurationDiff extends Component {
    state = {
        diff: null,
        displayColumns: null,
        labels: null,
    };

    componentDidMount() {
        const setOfSets = {};
        const displayColumns = [
            { 
                Header: 'Configuration Item', 
                accessor: 'name',
                Cell: props => 
                    <div className='Neo4jConfig_Name'>
                        <a 
                            target='neo4jConfig' 
                            href={this.baseURL + props.value}>
                            {props.value}
                        </a>                    
                    </div>,
            },
            {
                Header: 'Values Match', 
                accessor: 'unanimous',
                width: 125,
                filterMethod: (filter, row) => {
                    if (filter.value === "all") {
                        return true;
                    }
                    
                    if (filter.value === 'true') {
                        return row[filter.id];
                    } else { return !row[filter.id] }
                },
                Filter: ({ filter, onChange }) =>
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>,
                Cell: props => props.value ? 
                    <Icon color='green' name='checkmark'/> : 
                    <Icon color='red' name='cancel' />,
            },
        ];

        let idx = 0;

        this.props.data.nodes.forEach(node => {
            const label = node.basics.role + (idx++);
            const addr = node.basics.address;

            setOfSets[label] = _.cloneDeep(node.configuration);
            displayColumns.push({
                Header: addr,
                accessor: label,
                style: { whiteSpace: 'unset' },
            });
        });

        const diff = diffutil.configurationDiff(setOfSets);
        sentry.fine('DIFF', diff, displayColumns);
        this.setState({ diff, displayColumns });
    }

    render() {
        if (!this.state.diff) {
            return (
                <div className='ConfigurationDiff'>
                    <h4>Configuration Diff</h4>

                    No data specified.
                </div>
            );
        }

        return (
            <div className='ConfigurationDiff'>
                <h3>Configuration Difference</h3>

                Use the table below to explore similarities and differences between node configurations.

                <ReactTable
                    // By default, filter only catches data if the value STARTS WITH
                    // the entered string.  This makes it less picky.
                    defaultFilterMethod={(filter, row /* , column */) => {
                        const id = filter.pivotId || filter.id
                        return row[id] !== undefined ? String(row[id]).indexOf(filter.value) > -1 : true
                    }}
                    columns={this.state.displayColumns}
                    data={this.state.diff.table}
                    sortable={true}
                    filterable={true}
                    defaultPageSize={20}
                    showPagination={true}
                />

                I'm here! <pre style={{textAlign: 'left', maxWidth:800}}>{JSON.stringify(this.state.diff, null, 2)}</pre>
            </div>
        )
    }
}