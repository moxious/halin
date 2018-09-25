import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class DiskUsage extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Store file sizes') 
            YIELD attributes 
            WITH
                attributes.LogicalLogSize.value as logicalLog, 
                attributes.StringStoreSize.value as stringStore, 
                attributes.ArrayStoreSize.value as arrayStore, 
                attributes.RelationshipStoreSize.value as relStore, 
                attributes.PropertyStoreSize.value as propStore, 
                attributes.TotalStoreSize.value as total, 
                attributes.NodeStoreSize.value as nodeStore
            RETURN 
                logicalLog, stringStore, arrayStore, 
                relStore, propStore, total, nodeStore;        
        `,

        displayColumns: [
            { Header: 'Total Disk', accessor: 'total' },
            { Header: 'Node Store', accessor: 'nodeStore', show: false },
            { Header: 'Prop Store', accessor: 'propStore', show: false },
            { Header: 'Rel Store', accessor: 'relStore', show: false },
            { Header: 'Strings', accessor: 'stringStore', show: false },
            { Header: 'Arrays', accessor: 'arrayStore', show: false },
            { Header: 'Logical Log', accessor: 'logicalLog', show: false },
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
