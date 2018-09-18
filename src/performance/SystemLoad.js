import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';
import uuid from 'uuid';

class SystemLoad extends Component {
    state = {
        key: uuid.v4(),
        rate: 1000,
        width: 400,
        query: `
            CALL dbms.queryJmx('java.lang:type=OperatingSystem') 
            YIELD attributes 
            WITH 
                attributes.SystemLoadAverage as SystemLoad, 
                attributes.ProcessCpuLoad as ProcessLoad 
            RETURN 
                SystemLoad.value as systemLoad, 
                ProcessLoad.value as processLoad;
        `,

        displayColumns: [
            { Header: 'System Load', accessor: 'systemLoad'}, 
            { Header: 'Process Load', accessor: 'processLoad' },
        ],
    };

    render() {
        return (
            <div className="SystemLoad">
                <CypherTimeseries key={this.state.key}
                    driver={this.props.driver}
                    node={this.props.node}
                    query={this.state.query}
                    width={this.state.width}
                    rate={this.state.rate}
                    displayColumns={this.state.displayColumns}
                />
            </div>
        )
    }
}

export default SystemLoad;
