import React, { Component } from 'react';
import CypherTimeseries from '../timeseries/CypherTimeseries';

class SystemLoad extends Component {
    query = `
        CALL dbms.queryJmx('java.lang:type=OperatingSystem') 
        YIELD attributes 
        WITH 
            attributes.SystemLoadAverage as SystemLoad, 
            attributes.ProcessCpuLoad as ProcessLoad 
        RETURN 
            SystemLoad.value as systemLoad, 
            ProcessLoad.value as processLoad;
    `;

    displayColumns = [
        { Header: 'System Load', accessor: 'systemLoad'}, 
        { Header: 'Process Load', accessor: 'processLoad' },
    ];

    render() {
        return (
            <div className="SystemLoad">
                <CypherTimeseries 
                    query={this.query}
                    width={400}
                    rate={1000}
                    displayColumns={this.displayColumns}
                />
            </div>
        )
    }
}

export default SystemLoad;
