import HalinQuery from '../HalinQuery';
import fields from '../../fields';
const cdt = fields;

export default new HalinQuery({
    description: 'Fetches page cache statistics for running Neo4j',
    query: `
    CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Page cache')
    YIELD attributes 
    WITH 
        attributes.Faults.value as faults, 
        attributes.EvictionExceptions.value as evictionExceptions, 
        attributes.BytesWritten.value as bytesWritten, 
        attributes.Flushes.value as flushes, 
        attributes.UsageRatio.value as usageRatio, 
        attributes.Evictions.value as evictions, 
        attributes.FileUnmappings.value as fileUnmappings, 
        attributes.BytesRead.value as bytesRead, 
        attributes.FileMappings.value as fileMappings, 
        attributes.HitRatio.value as hitRatio 
    RETURN 
        hitRatio, bytesRead, fileMappings, fileUnmappings,
        flushes, usageRatio, bytesWritten, 
        faults, evictions, evictionExceptions`,
    columns: [
        { Header: 'Usage Ratio', accessor: 'usageRatio', Cell: cdt.pctField },
        { Header: 'Hit Ratio', accessor: 'hitRatio', Cell: cdt.pctField },
        { Header: 'Read', accessor: 'bytesRead', Cell: cdt.dataSizeField },
        { Header: 'Written', accessor: 'bytesWritten', Cell: cdt.dataSizeField },

        { Header: 'Faults', accessor: 'faults', Cell: cdt.numField },
        { Header: 'Flushes', accessor: 'flushes', Cell: cdt.numField, show: false },
        { Header: 'Evictions', accessor: 'evictions', Cell: cdt.numField, show: false },

        { Header: 'Eviction Except.', accessor: 'evictionExceptions', Cell: cdt.numField, show: false },
        { Header: 'File Mappings', accessor: 'fileMappings', Cell: cdt.numField, show: false },
        { Header: 'File Unmappings', accessor: 'fileUnmappings', Cell: cdt.numField, show: false },
    ],
    rate: 2000,
});