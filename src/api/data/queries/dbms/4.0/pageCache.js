import HalinQuery from '../../HalinQuery';
import fields from '../../../fields';
const cdt = fields;

/* In version 4.0 Neo4j JMX was substantially re-arranged.
 * This is the new JMX format for key bits of the page cache
 * query.  There are many beans mapping to individual system
 * metrics instead of a single page cache tracking bean as in
 * 3.5
 */
export default new HalinQuery({
    description: 'Fetches page cache statistics for running Neo4j',
    query: `
    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.page_cache.usage_ratio')
    YIELD attributes
    WITH attributes.Value.value as usageRatio

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.page_cache.hit_ratio')
    YIELD attributes
    WITH attributes.Value.value as hitRatio, usageRatio

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.page_cache.page_faults')
    YIELD attributes
    WITH attributes.Count.value as faults, hitRatio, usageRatio

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.page_cache.flushes')
    YIELD attributes
    WITH attributes.Count.value as flushes,
        faults, hitRatio, usageRatio

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.page_cache.evictions')
    YIELD attributes
    WITH attributes.Count.value as evictions,
        flushes, faults, hitRatio, usageRatio

    CALL dbms.queryJmx('neo4j.metrics:name=neo4j.page_cache.eviction_exceptions')
    YIELD attributes
    WITH attributes.Count.value as evictionExceptions,
        evictions, flushes, faults, hitRatio, usageRatio

    RETURN 
        hitRatio, 
        0 as bytesRead, /* Not yet supported */
        0 as fileMappings, /* Not yet supported */
        0 as fileUnmappings, /* Not yet supported */
        flushes, 
        usageRatio, 
        0 as bytesWritten, /* Not yet supported */
        faults, 
        evictions, 
        evictionExceptions`,
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
    exampleResult: [
        {
            hitRatio: 0.9945,
            bytesRead: 237650,
            bytesWritten: 237650,
            fileMappings: 40,
            fileUnmappings: 22,
            flushes: 16,
            usageRatio: 0.0001313,
            bytesWRitten: 163790,
            faults: 35,
            evictions: 0,
            evictionExceptions: 0,            
        },
    ],
});