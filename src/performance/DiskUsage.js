import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class DiskUsage extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Store sizes') 
            YIELD attributes 
            WITH
                attributes.CountStoreSize.value as countStore,
                attributes.IndexStoreSize.value as indexStore,
                attributes.LabelStoreSize.value as labelStore,
                attributes.NodeStoreSize.value as nodeStore,
                attributes.PropertyStoreSize.value as propStore, 
                attributes.RelationshipStoreSize.value as relStore, 
                attributes.SchemaStoreSize.value as schemaStore,
                attributes.StringStoreSize.value as stringStore, 
                attributes.TotalStoreSize.value as total, 
                attributes.TransactionLogsSize.value as txLogs,                 
                attributes.ArrayStoreSize.value as arrayStore
            RETURN 
                countStore, indexStore, labelStore,
                schemaStore, txLogs,
                stringStore, arrayStore, 
                relStore, propStore, total, nodeStore;        
        `,

        displayColumns: [
            { Header: 'Total Disk', accessor: 'total' },
            { Header: 'Nodes', accessor: 'nodeStore' },
            { Header: 'Rels', accessor: 'relStore' },
            { Header: 'Props', accessor: 'propStore' },
            { Header: 'Index', accessor: 'indexStore' },
            { Header: 'Schema', accessor: 'schemaStore' },
            { Header: 'TXs', accessor: 'txLogs' },
            { Header: 'Strings', accessor: 'stringStore' },
            { Header: 'Arrays', accessor: 'arrayStore' },            
        ],
    };

    render() {
        return (
            <div className="DiskUsage">
                <CypherTimeseries key={this.state.key}
                    driver={this.props.driver}
                    node={this.props.node}
                    query={this.state.query}
                    width={this.state.width}
                    rate={this.state.rate}
                    displayColumns={this.state.displayColumns}
                    startingEnabled={[
                        this.state.displayColumns[0]
                    ]}
                />
            </div>
        )
    }
}

export default DiskUsage;
