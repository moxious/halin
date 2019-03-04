import HalinQuery from '../HalinQuery';

export default new HalinQuery({
    description: 'Fetches system and process load averages using JMX',
    query: `        
    CALL dbms.queryJmx('java.lang:type=OperatingSystem') 
    YIELD attributes 
    WITH 
        attributes.SystemLoadAverage as SystemLoad, 
        attributes.ProcessCpuLoad as ProcessLoad 
    RETURN 
        SystemLoad.value as systemLoad, 
        ProcessLoad.value as processLoad`,
    columns: [
        { Header: 'System Load', accessor: 'systemLoad' },
        { Header: 'Process Load', accessor: 'processLoad' },
    ],
});